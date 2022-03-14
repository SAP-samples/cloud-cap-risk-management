
const cds = require('@sap/cds');
const { Risks } = cds.entities;
const LOG = cds.log('risk-service');

/**
 * Implementation for Risk Management service defined in ./risk-service.cds
 */
module.exports = cds.service.impl(async function() {

    const bupa = await cds.connect.to('API_BUSINESS_PARTNER');

    this.on('READ', 'Suppliers', async req => {
        return bupa.run(req.query);
    });

    this.after('READ', 'Risks', risksData => {
        const risks = Array.isArray(risksData) ? risksData : [risksData];
        risks.forEach(risk => {
            if (risk.impact >= 100000) {
                risk.criticality = 1;
            } else {
                risk.criticality = 2;
            }
        });
    });
    // Risks?$expand=supplier
    this.on("READ", 'Risks', async (req, next) => {
        if (!req.query.SELECT.columns) return next();
        const expandIndex = req.query.SELECT.columns.findIndex(
            ({ expand, ref }) => expand && ref[0] === "supplier"
        );
        if (expandIndex < 0) return next();

        // Remove expand from query
        req.query.SELECT.columns.splice(expandIndex, 1);

        // Make sure supplier_ID will be returned
        if (!req.query.SELECT.columns.indexOf('*') >= 0 &&
            !req.query.SELECT.columns.find(
                column => column.ref && column.ref.find((ref) => ref == "supplier_ID"))
        ) {
            req.query.SELECT.columns.push({ ref: ["supplier_ID"] });
        }

        const risks = await next();

        const asArray = x => Array.isArray(x) ? x : [ x ];

        // Request all associated suppliers
        const supplierIds = asArray(risks).map(risk => risk.supplier_ID);
        const suppliers = await bupa.run(SELECT.from('RiskService.Suppliers').where({ ID: supplierIds }));

        // Convert in a map for easier lookup
        const suppliersMap = {};
        for (const supplier of suppliers)
            suppliersMap[supplier.ID] = supplier;

        // Add suppliers to result
        for (const note of asArray(risks)) {
            note.supplier = suppliersMap[note.supplier_ID];
        }

        return risks;
    });

    this.after('UPDATE', 'Risks', async (riskData) => {
        if(riskData.impact > 1000) return;
        riskData.status_value = 'ASSESSED';
        await UPDATE(Risks).set({status_value: 'ASSESSED'}).where({ID: riskData.ID});
    });

    bupa.on( 'Created', async (msg) => {
        const { BusinessPartner } = msg.data;
        LOG.info('Received created! BusinessPartner=' + BusinessPartner);
        await createRisk(BusinessPartner);
    });

    bupa.on( 'Changed', async (msg) => {
        const { BusinessPartner } = msg.data;
        LOG.info('Received changed! BusinessPartner=' + BusinessPartner);
        if((await SELECT.one.from(Risks).where({supplier_ID: BusinessPartner})).status_value === 'NEW') return;
        await UPDATE(Risks).set({status_value: 'CHANGED'}).where({'supplier_ID' : BusinessPartner});
    });

    async function createRisk(businessPartner) {
        const payload = {
            title: 'auto: CFR non-compliance',
            descr: 'New Business Partner might violate CFR code',
            prio: '1',
            impact: 200000,
            supplier_ID: businessPartner,
            status_value: 'NEW'
        }
        LOG.info("Creating auto risk with", payload);
        await INSERT.into(Risks).entries(payload);
    }
});