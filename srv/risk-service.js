
const cds = require('@sap/cds')

/**
 * Implementation for Risk Management service defined in ./risk-service.cds
 */
module.exports = cds.service.impl(async function() {

    const bupa = await cds.connect.to('API_BUSINESS_PARTNER');

    // Risks('...')?$expand=supplier
    this.on('READ', 'Suppliers', async (req, next) => {
        const select = req.query.SELECT;

        if (!select.columns) return next();
        const expandIndex = select.columns.findIndex(
            ({ expand, ref }) => expand && ref[0] === "risks"
        );

        if (expandIndex < 0) return next();
        const expandColumns = select.columns[expandIndex].expand;

        // Remove expand from query
        req.query.SELECT.columns.splice(expandIndex, 1);

        // Make sure ID will be returned
        if (expandColumns.indexOf('*') == -1 &&
            !expandColumns.find(
                column => column.ref && column.ref.find((ref) => ref == "ID"))
        ) {
            expandColumns.push({ ref: ["ID"] });
        }

        const suppliers = await next();
        if (Array.isArray(suppliers) && suppliers.length > 0) throw new Error('Expand only allowed when requesting one supplier.');
        const supplier = Array.isArray(suppliers) ? suppliers[0] : suppliers;

        // Select all risks for a supplier
        supplier.risks = await this.run(SELECT(expandColumns)
            .from('RiskService.Risks')
            .where("supplier_ID = ", supplier.ID)
            .limit(select.limit?.rows?.val, select.limit?.offset?.val));

        return suppliers;
    });

    // Risks('...')/supplier
    this.on('READ', 'Suppliers', async (req, next) => {
        const select = req.query.SELECT;

        if (!(select.from.ref.length == 2 && select.from.ref[0].id == 'RiskService.Risks')) return next();

        const risk = await this.run(SELECT.one('supplier_ID')
            .from('RiskService.Risks')
            .where(select.from.ref[0].where));

        if (!risk) throw new Error(`Risk doesn't exists`);

        // Select all risks for a supplier
        const suppliers = await this.run(SELECT(select.columns)
            .from('RiskService.Suppliers')
            .where("ID = ", risk.supplier_ID)
            .limit(select.limit?.rows?.val, select.limit?.offset?.val));

        return suppliers;
    });

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
});
