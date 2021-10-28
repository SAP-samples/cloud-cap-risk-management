
const cds = require('@sap/cds')

/**
 * Implementation for Risk Management service defined in ./risk-service.cds
 */
module.exports = cds.service.impl(async function() {

    const bupa = await cds.connect.to('API_BUSINESS_PARTNER');

    // Risks('...')/supplier
    this.on('READ', 'Suppliers', async (req, next) => {
        const select = req.query.SELECT;

        if (select.from.ref.length === 2 &&
            select.from.ref[0].id === "RiskService.Risks" &&
            (select.from.ref[1] == "supplier" || select.from.ref[1].id === "supplier")) {

            // Get supplier ID from risk
            const { supplier_ID } = await this.run(SELECT.one("supplier_ID").from("Risks").where(select.from.ref[0].where));

            // Select all risks for a supplier
            const cql = SELECT(select.columns)
                .from('RiskService.Suppliers')
                .where("ID = ", supplier_ID)
                .limit(select.limit?.rows?.val, select.limit?.offset?.val);
            cql.SELECT.count = !!select.count;
            const supplier = await bupa.run(cql);

            return supplier;

        } else {
            return next();
        }
    });

    this.on('READ', 'Suppliers', async req => {
        return bupa.run(req.query);
    });

    // Risks?$expand=supplier
    this.on("READ", 'Risks', async (req, next) => {
        const expandIndex = req.query.SELECT.columns.findIndex(
            ({ expand, ref }) => expand && ref[0] === "supplier"
        );
        if (expandIndex < 0) return next();

        // Remove expand from query
        req.query.SELECT.columns.splice(expandIndex, 1);

        // Make sure supplier_ID will be returned
        if (!req.query.SELECT.columns.find(
                column => column.ref.find((ref) => ref == "supplier_ID"))
        )
        req.query.SELECT.columns.push({ ref: ["supplier_ID"] });

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
        for (const risk of asArray(risks)) {
            risk.supplier = suppliersMap[risk.supplier_ID];
        }

        return risks;
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

    // Suppliers('...')/risks
    this.on('READ', 'Risks', async (req, next) => {
        const select = req.query.SELECT;

        if (select.from.ref.length === 2 &&
            select.from.ref[0].id === "RiskService.Suppliers" &&
            select.from.ref[0].where[0].ref[0] === "ID" &&
            select.from.ref[0].where[1] === "=" &&
            select.from.ref[0].where[2].val &&
            (select.from.ref[1] == "risks" || select.from.ref[1].id === "risks")) {

            // Select all risks for a supplier
            const cql = SELECT(select.columns)
                .from('Risks')
                .where("supplier_ID = ", select.from.ref[0].where[2].val)
                .limit(select.limit?.rows?.val, select.limit?.offset?.val);
            cql.SELECT.count = !!select.count;
            const risks = await this.run(cql);
            return risks;

        } else {
            return next();
        }
    });

});
