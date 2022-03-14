const cds = require('@sap/cds')

module.exports = cds.service.impl(async function() {
    this.after('INSERT', data => {
        const { BusinessPartner } = data;
        return this.emit('Created', { BusinessPartner });
    });

    this.after('UPDATE', data => {
        const { BusinessPartner } = data;
        return this.emit('Changed', { BusinessPartner });
    });
});
