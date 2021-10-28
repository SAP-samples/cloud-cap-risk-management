const cds = require("@sap/cds/lib");
const express = require("express");
if (cds.User.default) cds.User.default = cds.User.Privileged;
// hard core monkey patch
else cds.User = cds.User.Privileged; // hard core monkey patch for older cds releases
process.env.S4_APIKEY = "mock";

const envelope = (context, value) => {
  return {"@odata.context": context, value };
}

const MockServer = require('./MockServer');

// curl 'http://localhost:4004/service/risk/Suppliers' -u risk.manager@tester.sap.com:initial | jq . >test/data/suppliers.json
const Suppliers = require('./data/suppliers.json');

// curl 'http://localhost:4004/api-business-partner/A_BusinessPartner?$top=11&$select=BusinessPartner,BusinessPartnerFullName,BusinessPartnerIsBlocked' -u risk.manager@tester.sap.com:initial | jq . >test/data/bps.json
const BPs = require('./data/bps.json');

// curl 'http://localhost:4004/service/risk/Risks?$top=11&$expand=supplier&$select=ID,title,prio,impact,supplier_ID' -u risk.manager@tester.sap.com:initial | jq . >test/data/risks-expand-supplier.json
const RisksExpandSuppliers = require('./data/risks-expand-supplier.json');

const Risks = {value: RisksExpandSuppliers.value.map( ({ID, title, prio, impact, supplier_ID}) => ({ID, title, prio, impact, supplier_ID}) ) };

const BPMock = {
  url: /.*/,
  data: BPs
};

const BPMock1 = {
  url: /\/A_BusinessPartner\?.*\$filter=BusinessPartner%20eq%20%271000040%27/,
  data: {
      "@odata.context": "../$metadata#Suppliers/$entity",
      value: BPs.value[1]
  }
};

if (!global.beforeAll) global.beforeAll = global.before;

describe("Supplier", () => {
  const mockServer = new MockServer();

  beforeAll( async () => {
    mockServer.start();

    // TODO: Need better solution. Does it conflict with other tests?
    cds.env.add({
      requires: {
        API_BUSINESS_PARTNER: {
          kind: "odata",
          model: "srv/external/API_BUSINESS_PARTNER",
          credentials: {
            url: mockServer.url()
          },
        },
      },
    });

  });

  beforeEach( () => {
    mockServer.reset();
  });

  module.exports = cds.test.in(__dirname,'..')


  const { expect, GET, PATCH } = require('@sap/cds').test.in(__dirname, "..").run(
    "serve",
    "--with-mocks",
    "--in-memory"
  );


  it("get risks", async () => {
    const { status, data } = await GET("/service/risk/Risks");

    expect({ status, data }).to.containSubset({
      status: 200,
      data: Risks,
    });
  });

  it("get remote suppliers", async () => {
    mockServer.add(BPMock);
    const { status, data } = await GET("/service/risk/Suppliers");

    expect({ status, data }).to.containSubset({
      status: 200,
      data: Suppliers
    });
  });

  it("get risks via navigation", async () => {
    mockServer.add(BPMock);
    const { status, data } = await GET("/service/risk/Suppliers('1000038')/risks");

    expect({ status, data }).to.containSubset({
      status: 200,
      data: envelope('../$metadata#Risks', [ Risks.value[0] ] )
    });
  });

  it("get risks with remote suppliers", async () => {
    mockServer.add(BPMock);
    const { status, data } = await GET("/service/risk/Risks?$expand=supplier");

    expect({ status, data }).to.containSubset({
      status: 200,
      data: envelope('$metadata#Risks(supplier())', RisksExpandSuppliers.value)
    });
  });

  it("get remote supplier via navigation", async () => {
    mockServer.add(BPMock1);
    const { status, data } = await GET(`/service/risk/Risks(ID=${ RisksExpandSuppliers.value[1].ID },IsActiveEntity=true)/supplier`);
    expect({ status, data }).to.containSubset({
      status: 200,
      data: Object.assign({"@odata.context": "../$metadata#Suppliers/$entity"}, RisksExpandSuppliers.value[1].supplier)
    });
  });

  afterAll(() => mockServer.close());
});
