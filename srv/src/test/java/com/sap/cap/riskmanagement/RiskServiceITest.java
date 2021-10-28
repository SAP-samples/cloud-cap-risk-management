package com.sap.cap.riskmanagement;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles({"default", "mocked"})
public class RiskServiceITest {

	private static final String risksURI = "/risks/Risks";
	private static final String suppliersURI = "/risks/Suppliers";

	@Autowired
	private WebTestClient client;

	@Test
	public void testGetRisks() throws Exception {
		client.get().uri(risksURI).exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Risks")
				.jsonPath("$.value[0].ID").isEqualTo("24b58115-e394-423b-beab-53419a32b927")
				.jsonPath("$.value[0].note").isEqualTo("Fast Bikes is a reliable supplier")
				.jsonPath("$.value[0].supplier_ID").isEqualTo("1000020")
				.jsonPath("$.value[1].ID").isEqualTo("545a3cf9-84cf-46c8-93dc-e29f0f2bc6be")
				.jsonPath("$.value[1].note").isEqualTo("Bikes Pro delivers in time")
				.jsonPath("$.value[1].supplier_ID").isEqualTo("1000021")
				.jsonPath("$.value[2].ID").isEqualTo("d632d4ee-e772-454a-913e-26a7b8daa7fb")
				.jsonPath("$.value[2].note").isEqualTo("Bikes Pro has a lot in store")
				.jsonPath("$.value[2].supplier_ID").isEqualTo("1000021");
	}

	@Test
	public void testGetSuppliers() throws Exception {
		client.get().uri(suppliersURI + "?$filter=ID eq '1000021'").exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Suppliers")
				.jsonPath("$.value[0].ID").isEqualTo("1000021")
				.jsonPath("$.value[0].fullName").isEqualTo("Bikes Pro Inc.");
	}

	@Test
	public void testGetNoteWithSuppliers() throws Exception {
		client.get().uri(risksURI + "?$expand=supplier").exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Risks(supplier())")
				.jsonPath("$.value[0].ID").isEqualTo("24b58115-e394-423b-beab-53419a32b927")
				.jsonPath("$.value[0].note").isEqualTo("Fast Bikes is a reliable supplier")
				.jsonPath("$.value[0].supplier_ID").isEqualTo("1000020")
				.jsonPath("$.value[0].supplier.ID").isEqualTo("1000020")
				.jsonPath("$.value[0].supplier.fullName").isEqualTo("Fast Bikes Inc.")
				.jsonPath("$.value[1].ID").isEqualTo("545a3cf9-84cf-46c8-93dc-e29f0f2bc6be")
				.jsonPath("$.value[1].note").isEqualTo("Bikes Pro delivers in time")
				.jsonPath("$.value[1].supplier_ID").isEqualTo("1000021")
				.jsonPath("$.value[1].supplier.ID").isEqualTo("1000021")
				.jsonPath("$.value[1].supplier.fullName").isEqualTo("Bikes Pro Inc.")
				.jsonPath("$.value[2].ID").isEqualTo("d632d4ee-e772-454a-913e-26a7b8daa7fb")
				.jsonPath("$.value[2].note").isEqualTo("Bikes Pro has a lot in store")
				.jsonPath("$.value[2].supplier_ID").isEqualTo("1000021")
				.jsonPath("$.value[2].supplier.ID").isEqualTo("1000021")
				.jsonPath("$.value[2].supplier.fullName").isEqualTo("Bikes Pro Inc.");
	}

	@Test
	public void testGetSuppliersWithRisks() throws Exception {
		client.get().uri(suppliersURI + "?$expand=risks($orderby=ID)&$filter=ID eq '1000021'").exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Suppliers(risks())")
				.jsonPath("$.value[0].ID").isEqualTo("1000021")
				.jsonPath("$.value[0].fullName").isEqualTo("Bikes Pro Inc.")
				.jsonPath("$.value[0].risks[0].ID").isEqualTo("545a3cf9-84cf-46c8-93dc-e29f0f2bc6be")
				.jsonPath("$.value[0].risks[0].note").isEqualTo("Bikes Pro delivers in time")
				.jsonPath("$.value[0].risks[0].supplier_ID").isEqualTo("1000021")
				.jsonPath("$.value[0].risks[1].ID").isEqualTo("d632d4ee-e772-454a-913e-26a7b8daa7fb")
				.jsonPath("$.value[0].risks[1].note").isEqualTo("Bikes Pro has a lot in store")
				.jsonPath("$.value[0].risks[1].supplier_ID").isEqualTo("1000021");
	}

	@Test
	public void testGetRisksToSupplier() throws Exception {
		client.get().uri(risksURI + "(545a3cf9-84cf-46c8-93dc-e29f0f2bc6be)/supplier").exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Suppliers/$entity")
				.jsonPath("$.ID").isEqualTo("1000021")
				.jsonPath("$.fullName").isEqualTo("Bikes Pro Inc.");
	}

	@Test
	public void testGetSupplierToRisks() throws Exception {
		client.get().uri(suppliersURI + "('1000021')/risks").exchange()
				.expectStatus().isOk()
				.expectBody()
				.jsonPath("$.['@context']").isEqualTo("$metadata#Risks")
				.jsonPath("$.value[0].ID").isEqualTo("545a3cf9-84cf-46c8-93dc-e29f0f2bc6be")
				.jsonPath("$.value[0].note").isEqualTo("Bikes Pro delivers in time")
				.jsonPath("$.value[0].supplier_ID").isEqualTo("1000021")
				.jsonPath("$.value[1].ID").isEqualTo("d632d4ee-e772-454a-913e-26a7b8daa7fb")
				.jsonPath("$.value[1].note").isEqualTo("Bikes Pro has a lot in store")
				.jsonPath("$.value[1].supplier_ID").isEqualTo("1000021");
	}

}
