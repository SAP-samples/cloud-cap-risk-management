namespace sap.ui.riskmanagement;
using { managed } from '@sap/cds/common';

  entity Risks : managed {
    key ID      : UUID  @(Core.Computed : true);
    title       : String(100);
    prio        : String(5);
    descr       : String;
    miti        : Association to Mitigations;
    impact      : Integer;
    criticality : Integer;
    supplier    : Association to Suppliers;
  }

  entity Mitigations : managed {
    key ID       : UUID  @(Core.Computed : true);
    description  : String;
    owner        : String;
    timeline     : String;
    risks        : Association to many Risks on risks.miti = $self;
  }

  // using an external service from
  using {  API_BUSINESS_PARTNER as bupa } from '../srv/external/API_BUSINESS_PARTNER';

  view Suppliers as select from bupa.A_BusinessPartner mixin {
      risks : association to many Risks on risks.supplier.ID = $projection.ID;
  } into {
      key BusinessPartner as ID,
      BusinessPartnerFullName as fullName,
      BusinessPartnerIsBlocked as isBlocked,
      risks,
      //      to_BusinessPartnerAddress as addresses: redirected to SupplierAddresses
  };

  entity SupplierAddresses as projection on bupa.A_BusinessPartnerAddress {
    BusinessPartner as bupaID,
    AddressID as ID,
    CityName as city,
    StreetName as street,
    County as county
  }
