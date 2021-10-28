const cds = require("@sap/cds/lib");
const express = require("express");
const Path = require("path");
const chai = require("chai");
const { fs } = require("@sap/cds/lib/utils");
const MockServer = require("./MockServer");
const { expect } = chai;
chai.use(require("chai-subset"));

let bupa;

function saveData(data, name) {
  const dataPath = Path.join(__dirname, "data/odata-examples", `${name}.json`);
  const { writeFileSync } = require("fs");
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getData(name) {
    const dataPath = Path.join(__dirname, "data/odata-examples", `${name}.json`);
    const { readFileSync } = require("fs");
    return JSON.parse(readFileSync(dataPath));
}

function testData(data, name) {
  if (process.env.CDS_SAVE_TEST_DATA) saveData(data, name);
  const expectedData = getData(name);

  expect(data).to.containSubset(expectedData);
}

function print(o) {
  if (typeof o === "object") {
    console.log(JSON.stringify(o, null, 2));
  } else {
    console.log(o);
  }
}

let mockServer;
let cdsServer;
async function bootstrap() {

  if (!process.env.S4_APIKEY) {
    mockServer = new MockServer();
    await mockServer.start();

    cds.env.add({
      requires: {
        API_BUSINESS_PARTNER: {
          kind: "odata",
          model: "srv/external/API_BUSINESS_PARTNER",
          credentials: {
            url: mockServer.url(),
          },
        },
      },
    });
  }


  cds.on("listening", ({server}) => {
    cdsServer = server;
  });

  await cds.exec("serve", "all", "--with-mocks", "--in-memory");
  bupa = (await connectToBupa()).tx({});
}

async function connectToBupa() {
  const bupa = await cds.connect.to("API_BUSINESS_PARTNER");

  const s4apiKey = process.env.S4_APIKEY;
  if (!s4apiKey && cds.env.profiles.indexOf("sandbox") >= 0) {
    console.error(
      "[ERROR] Provide API Key in env var S4_APIKEY for S/4 Sandbox: https://api.sap.com/api/API_BUSINESS_PARTNER/resource -> Show API Key"
    );
    process.exit(1);
  }
  const bupaWrapper = s4apiKey
    ? {
        tx: (ctx) => {
          const tx = bupa.tx(ctx);
          return {
            run: (query) => tx.send({ query, headers: { APIKey: s4apiKey } }),
          };
        },
      }
    : bupa;

  return bupaWrapper;
}

if (!global.beforeAll) global.beforeAll = global.before;
if (!global.afterAll) global.afterAll = global.after;

describe("Notes OData Queries", () => {
  beforeAll(async () => {
    await bootstrap();
  });

  beforeEach( () => {
    if (mockServer) mockServer.reset();
  });


  it("select BusinessPartner with *", async () => {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$top=10", data: getData("select-bp-with-columns")});

    const result = await bupa.run(
      SELECT("*").from("API_BUSINESS_PARTNER.A_BusinessPartner").limit(10)
    );
    testData(result, "select-bp-with-columns");
  });

  it("select BusinessPartner - where", async () => {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$filter=BusinessPartnerCategory%20eq%20%272%27%20and%20CreationDate%20ge%202020-09-18T00:00:00%20and%20(BusinessPartnerGrouping%20eq%20%27BPAB%27%20or%20BusinessPartnerGrouping%20eq%20%27BP01%27)&$top=10", data: getData("select-bp-where")});

    const result = await bupa.run(
      SELECT("*")
        .from("API_BUSINESS_PARTNER.A_BusinessPartner")
        .where(
          `BusinessPartnerCategory = '2' and CreationDate >= '2020-09-18T00:00:00' and BusinessPartnerGrouping in ( 'BPAB', 'BP01' )`
        )
        .limit(10)
    );
    testData(result, "select-bp-where");
  });

  it("select BusinessPartner - orderby", async () => {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$select=BusinessPartnerFullName&$filter=BusinessPartnerCategory%20eq%20%272%27%20and%20CreationDate%20ge%202020-09-18T00:00:00%20and%20BusinessPartnerGrouping%20eq%20%27BPAB%27&$orderby=BusinessPartnerFullName%20asc", data: getData("select-bp-orderby")});

    const result = await bupa.run(
      SELECT("BusinessPartnerFullName")
        .from("API_BUSINESS_PARTNER.A_BusinessPartner")
        .where(
          `BusinessPartnerCategory = '2' and CreationDate >= '2020-09-18T00:00:00' and BusinessPartnerGrouping = 'BPAB'`
        )
        .orderBy("BusinessPartnerFullName")
    );
    testData(result, "select-bp-orderby");
  });

  it("select BusinessPartner with columns", async function () {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$select=BusinessPartner,BusinessPartnerCategory,BusinessPartnerFullName,BusinessPartnerUUID,CreatedByUser,CreationDate&$top=10", data: getData("select-bp-with-columns")});

    const result = await bupa.run(
      SELECT(
        "BusinessPartner",
        "BusinessPartnerCategory",
        "BusinessPartnerFullName",
        "BusinessPartnerUUID",
        "CreatedByUser",
        "CreationDate"
      )
        .from("API_BUSINESS_PARTNER.A_BusinessPartner")
        .limit(10)
    );

    testData(result, "select-bp-with-columns");
  });

  it("select BusinessPartner with expand *", async function () {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$select=BusinessPartner,BusinessPartnerFullName&$expand=to_BusinessPartnerAddress&$top=10", data: getData("expand-bp")});

    const result = await bupa.run(
      SELECT.from("API_BUSINESS_PARTNER.A_BusinessPartner", (bp) => {
        bp.BusinessPartner,
          bp.BusinessPartnerFullName,
          bp.to_BusinessPartnerAddress((addresses) => {
            addresses("*");
          });
      }).limit(10)
    );
    testData(result, "expand-bp");
  });

  it("select BusinessPartner with expand columns", async function () {
    if (mockServer) mockServer.add({url: "/A_BusinessPartner?$select=BusinessPartner,BusinessPartnerFullName&$expand=to_BusinessPartnerAddress($select=AddressID,ValidityStartDate,CityName,Country)&$top=10", data: getData("expand-bp-with-columns")});

    const result = await bupa.run(
      SELECT.from("API_BUSINESS_PARTNER.A_BusinessPartner", (bp) => {
        bp.BusinessPartner,
          bp.BusinessPartnerFullName,
          bp.to_BusinessPartnerAddress((addresses) => {
            addresses.AddressID,
              addresses.ValidityStartDate,
              addresses.CityName,
              addresses.Country;
          });
      }).limit(10)
    );
    testData(result, "expand-bp-with-columns");
  });

  afterAll(async () => {
    if (mockServer) mockServer.close();
    cdsServer.close();
  });
});
