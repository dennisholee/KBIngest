# Data Contract: Global Party Master & Governance

**Version:** `1.3.0`  
**Status:** `Production`  
**Description:** Unified Party model with integrated Regulatory (KYC/AML) and Privacy (GDPR) metadata.

## 1. Metadata
- **Contract Version:** 1.3.0
- **Title:** Global Party Master & Governance Contract
- **Owner:** Customer_MDM_Team
- **Classification:** Highly Confidential (PII)

---

## 2. Schema Definition

### Core Identity & Governance

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `party_id` | `uuid` | `primary_key`, `not_null` | Persistent Global Unique Identifier (GUID). |
| `party_type` | `string` | `enum: [INDIVIDUAL, ORGANIZATION]`, `not_null` | Discriminator for subtype logic. |
| `data_sovereignty_region` | `string` | `not_null` | Critical for GDPR/Cross-border data flow (e.g., EU, US, HK). |

### PII & Regulatory (Tax Residency)

| Column | Type | Tags | Description |
| :--- | :--- | :--- | :--- |
| `tax_identities` | `array` | — | Supports multi-jurisdiction tax residency (FATCA/CRS). |
| ↳ `tax_id` | `string` | `PII`, `ENCRYPTED` | Individual/Company Tax ID. |
| ↳ `issuing_country` | `string` | — | Country of tax issuance. |
| ↳ `is_primary_tax_residence` | `boolean` | — | Priority flag for CRS reporting. |

### Individual Sub-type

| Column | Type | Tags | Description |
| :--- | :--- | :--- | :--- |
| `individual_details` | `record` | — | Only populated if `party_type` is `INDIVIDUAL`. |
| ↳ `birth_date` | `date` | `PII`, `SENSITIVE_PERSONAL_DATA` | Date of birth. |
| ↳ `deceased_indicator` | `boolean` | — | Lifecycle trigger for account freezing. |

### Organization Sub-type

| Column | Type | Description |
| :--- | :--- | :--- |
| `organization_details` | `record` | Only populated if `party_type` is `ORGANIZATION`. |
| ↳ `registration_number` | `string` | Official business registry number. |
| ↳ `legal_entity_identifier` | `string` | Global LEI for MiFID II reporting. |
| ↳ `constitution_date` | `date` | Incorporation/Founding date. |

### Audit, Risk & Compliance

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `kyc_status` | `string` | `enum: [PENDING, VERIFIED, EXPIRED, WAIVED]` | Current KYC stage. |
| `next_kyc_review_date` | `date` | — | Predictive field for operational backlog. |
| `party_status` | `string` | `enum: [PROSPECT, ACTIVE, DORMANT, CLOSED, BLACKLISTED]` | Current lifecycle state. |

---

## 3. Quality Assertions & Business Rules

1. **Primary Tax Residency Check**
   - **Description:** Active parties must have exactly one primary tax residence for CRS reporting.
   - **Condition:** `party_status == 'ACTIVE' => count(tax_identities, x -> x.is_primary_tax_residence == true) == 1`

2. **KYC Freshness Check**
   - **Description:** Active Medium-Risk customers must have a review date within the last 1095 days.
   - **Condition:** `party_status == 'ACTIVE' AND risk_rating == 'MEDIUM' => date_diff(current_date, last_kyc_review_date) <= 1095`

3. **LEI Requirement**
   - **Description:** Organizations in the EU must have a Legal Entity Identifier.
   - **Condition:** `party_type == 'ORGANIZATION' AND data_sovereignty_region == 'EU' => organization_details.legal_entity_identifier IS NOT NULL`

4. **Right to Erasure Protection**
   - **Description:** Blacklisted parties cannot be purged even if GDPR erasure is requested.
   - **Condition:** `party_status == 'BLACKLISTED' => is_deletable == false`
