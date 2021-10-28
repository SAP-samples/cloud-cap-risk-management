package com.sap.cap.riskmanagement.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import com.sap.cds.Result;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Predicate;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.StructuredTypeRef;
import com.sap.cds.ql.cqn.CqnAnalyzer;
import com.sap.cds.ql.cqn.CqnExpand;
import com.sap.cds.ql.cqn.CqnReference.Segment;
import com.sap.cds.ql.cqn.CqnSelect;
import com.sap.cds.ql.cqn.CqnSelectListItem;
import com.sap.cds.ql.cqn.CqnStructuredTypeRef;
import com.sap.cds.ql.cqn.Modifier;
import com.sap.cds.reflect.CdsModel;
import com.sap.cds.services.cds.CdsReadEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;

import cds.gen.api_business_partner.ApiBusinessPartner_;
import cds.gen.riskservice.RiskService_;
import cds.gen.riskservice.Risks;
import cds.gen.riskservice.Risks_;
import cds.gen.riskservice.Suppliers;
import cds.gen.riskservice.Suppliers_;

@Component
@ServiceName(RiskService_.CDS_NAME)
public class RiskServiceHandler implements EventHandler {

	private final CqnService bupa;
	private final CqnAnalyzer analyzer;

	@Autowired
	RiskServiceHandler(@Qualifier(ApiBusinessPartner_.CDS_NAME) CqnService bupa, CdsModel model) {
		this.bupa = bupa;
		this.analyzer = CqnAnalyzer.create(model);
	}


	@On(entity = Suppliers_.CDS_NAME)
	Result readSuppliers(CdsReadEventContext context) {
		List<? extends Segment> segments = context.getCqn().ref().segments();
		// via risks
		if(segments.size() == 2 && segments.get(0).id().equals(Risks_.CDS_NAME)) {
			Map<String, Object> riskKeys = analyzer.analyze(context.getCqn()).rootKeys();
			Risks risk = context.getService().run(Select.from(Risks_.class).columns(n -> n.supplier_ID()).matching(riskKeys)).single(Risks.class);
			CqnSelect supplierOfRisk = CQL.copy(context.getCqn(), new Modifier() {

				@Override
				public CqnStructuredTypeRef ref(StructuredTypeRef ref) {
					return CQL.entity(Suppliers_.CDS_NAME).filter(p -> p.get(Suppliers.ID).eq(risk.getSupplierId())).asRef();
				}

			});
			return context.getService().run(supplierOfRisk);
		}

		// risks expanded?
		AtomicReference<CqnExpand> risksExpandHolder = new AtomicReference<>();
		CqnSelect noRisksExpand = CQL.copy(context.getCqn(), new Modifier() {

			public List<CqnSelectListItem> items(List<CqnSelectListItem> items) {
				risksExpandHolder.set(removeIfExpanded(items, Suppliers.RISKS));
				return ensureSelected(items, Suppliers.ID);
			}

		});

		// read suppliers
		Result suppliers = bupa.run(noRisksExpand);

		// add expanded risks?
		CqnExpand risksExpand = risksExpandHolder.get();
		if(risksExpand != null) {
			List<String> supplierIds = suppliers.streamOf(Suppliers.class).map(s -> s.getId()).collect(Collectors.toList());
			Select<?> risksSelect = Select.from(Risks_.class)
					.columns(ensureSelected(risksExpand.items(), Risks.SUPPLIER_ID))
					.orderBy(risksExpand.orderBy())
					.where(n -> n.supplier_ID().in(supplierIds));

			Result risks = context.getService().run(risksSelect);
			for(Suppliers supplier : suppliers.listOf(Suppliers.class)) {
				supplier.setRisks(risks.streamOf(Risks.class).filter(n -> n.getSupplierId().equals(supplier.getId())).collect(Collectors.toList()));
			}
		}

		return suppliers;
	}

	@On(entity = Risks_.CDS_NAME)
	void readRisks(CdsReadEventContext context) {
		List<? extends Segment> segments = context.getCqn().ref().segments();
		// via suppliers
		if(segments.size() == 2 && segments.get(0).id().equals(Suppliers_.CDS_NAME)) {
			String supplierId = (String) analyzer.analyze(context.getCqn()).rootKeys().get(Suppliers.ID);
			CqnSelect risksOfSupplier = CQL.copy(context.getCqn(), new Modifier() {

				@Override
				public CqnStructuredTypeRef ref(StructuredTypeRef ref) {
					return CQL.entity(Risks_.CDS_NAME).asRef();
				}

				@Override
				public Predicate where(Predicate where) {
					Predicate ofSupplier = CQL.get(Risks.SUPPLIER_ID).eq(supplierId);
					if(where != null) {
						ofSupplier = ofSupplier.and(where);
					}
					return ofSupplier;
				}

			});
			context.setResult(context.getService().run(risksOfSupplier));
			return;
		}

		// supplier expanded?
		AtomicReference<CqnExpand> supplierExpandHolder = new AtomicReference<>();
		CqnSelect noSupplierExpand = CQL.copy(context.getCqn(), new Modifier() {

			public List<CqnSelectListItem> items(List<CqnSelectListItem> items) {
				supplierExpandHolder.set(removeIfExpanded(items, Risks.SUPPLIER));
				return ensureSelected(items, Risks.SUPPLIER_ID);
			}

		});

		CqnExpand supplierExpand = supplierExpandHolder.get();
		if(supplierExpand != null) {
			// read risks and join with suppliers
			Result risks = context.getService().run(noSupplierExpand);
			List<String> supplierIds = risks.streamOf(Risks.class).map(s -> s.getSupplierId()).filter(s -> s != null).collect(Collectors.toList());
			if (supplierIds.size() > 0) {
				Select<?> supplierSelect = Select.from(Suppliers_.class)
						.columns(ensureSelected(supplierExpand.items(), Suppliers.ID))
						.orderBy(supplierExpand.orderBy())
						.where(n -> n.ID().in(supplierIds));

				Result suppliers = context.getService().run(supplierSelect);
				for(Risks risk : risks.listOf(Risks.class)) {
					risk.setSupplier(suppliers.streamOf(Suppliers.class).filter(s -> s.getId().equals(risk.getSupplierId())).findFirst().orElse(null));
				}
			}
			context.setResult(risks);
			return;
		}
	}

	private CqnExpand removeIfExpanded(List<CqnSelectListItem> items, String association) {
		CqnExpand expanded = items.stream().filter(i -> i.isExpand()).map(i -> i.asExpand())
			.filter(i -> i.ref().firstSegment().equals(association)).findFirst().orElse(null);
		if(expanded != null) {
			items.remove(expanded);
		}
		return expanded;
	}

	private List<CqnSelectListItem> ensureSelected(List<CqnSelectListItem> items, String element) {
		if(items.stream().anyMatch(i -> i.isStar() || i.isValue() && i.asValue().displayName().equals(element))) {
			return items;
		}
		List<CqnSelectListItem> newItems = new ArrayList<>(items);
		newItems.add(CQL.get(element));
		return newItems;
	}

}
