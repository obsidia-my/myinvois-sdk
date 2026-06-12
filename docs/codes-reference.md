# Codes Reference

Reference tables for all enumeration codes used in MyInvois documents.

---

## State codes (`countrySubentityCode`)

Used in `address.countrySubentityCode` for Malaysian addresses.

| Code | State |
|---|---|
| `01` | Johor |
| `02` | Kedah |
| `03` | Kelantan |
| `04` | Melaka |
| `05` | Negeri Sembilan |
| `06` | Pahang |
| `07` | Pulau Pinang |
| `08` | Perak |
| `09` | Perlis |
| `10` | Selangor |
| `11` | Terengganu |
| `12` | Sabah |
| `13` | Sarawak |
| `14` | Wilayah Persekutuan Kuala Lumpur |
| `15` | Wilayah Persekutuan Labuan |
| `16` | Wilayah Persekutuan Putrajaya |
| `17` | Luar Negara (overseas) |

> Code `00` is deprecated — do not use.

---

## Tax types (`taxCategory.taxType`)

| Code | Description |
|---|---|
| `01` | Sales Tax |
| `02` | Service Tax |
| `03` | Tourism Tax |
| `04` | High Value Goods Tax |
| `05` | Sales Tax on Low Value Goods |
| `06` | Not Applicable |
| `E` | Tax Exemption |

When `taxType` is `E`, you must provide `exemptionReason` in the tax category.

---

## Payment modes (`paymentMeans.paymentMeansCode`)

| Code | Description |
|---|---|
| `01` | Cash |
| `02` | Cheque |
| `03` | Bank Transfer |
| `04` | Credit Card |
| `05` | Debit Card |
| `06` | e-Wallet / Digital Wallet |
| `07` | Digital Bank |
| `08` | Others |

---

## Unit of measure codes (`unitCode`)

Selected codes from UN/ECE Recommendation 20:

| Code | Description |
|---|---|
| `C62` | Unit (general) |
| `EA` | Each |
| `HUR` | Hour |
| `DAY` | Day |
| `MON` | Month |
| `ANM` | Year |
| `KGM` | Kilogram |
| `GRM` | Gram |
| `TNE` | Tonne |
| `LTR` | Litre |
| `MLT` | Millilitre |
| `MTR` | Metre |
| `CMT` | Centimetre |
| `MMT` | Millimetre |
| `KTM` | Kilometre |
| `MTK` | Square Metre |
| `MTQ` | Cubic Metre |
| `SET` | Set |
| `PAR` | Pair |
| `DOZ` | Dozen |
| `BOX` | Box |
| `PKG` | Package |
| `BAG` | Bag |
| `ROL` | Roll |
| `SHT` | Sheet |
| `GT` | Gross Tonnage |

---

## Classification codes (`classificationCode`)

Used in `invoiceLine.classificationCode` to indicate what type of product/service is on the line:

| Code | Description |
|---|---|
| `001` | Breastfeeding equipment |
| `002` | Child care centre and kindergarten fees |
| `003` | Computer, smartphone or tablet |
| `004` | Consolidated e-Invoice |
| `005` | Construction materials (as input tax) |
| `006` | Disbursement |
| `007` | Donation |
| `008` | e-Commerce — goods |
| `009` | e-Commerce — services |
| `010` | Education fees |
| `011` | Electricity |
| `012` | Employee |
| `013` | Exported goods |
| `014` | Export services |
| `015` | Financial services |
| `016` | Foreign income |
| `017` | Funeral expenses |
| `018` | General |
| `019` | Goods |
| `020` | Hotel accommodation |
| `021` | Insurance |
| `022` | Interest |
| `023` | Internet subscription |
| `024` | Land and building (rental) |
| `025` | Lease |
| `026` | Maintenance |
| `027` | Management fees |
| `028` | Medical expenses |
| `029` | Motor vehicle (as input tax) |
| `030` | Others |
| `031` | Parking |
| `032` | Petroleum operations |
| `033` | Private retirement scheme |
| `034` | Professional fees |
| `035` | Rental |
| `036` | Royalty |
| `037` | Self-billed — betting and gaming |
| `038` | Self-billed — importation of goods |
| `039` | Self-billed — importation of services |
| `040` | Self-billed — monetary payment to agents, dealers, distributors |
| `041` | Self-billed — others |
| `042` | Services |
| `043` | Sports equipment, gym membership, Internet |
| `044` | Supporting equipment for disabled persons |
| `045` | Toll |

---

## Country codes (`countryCode`)

Selected ISO 3166-1 alpha-3 codes used in `address.countryCode`:

| Code | Country |
|---|---|
| `MYS` | Malaysia |
| `SGP` | Singapore |
| `USA` | United States |
| `GBR` | United Kingdom |
| `AUS` | Australia |
| `CHN` | China |
| `JPN` | Japan |
| `KOR` | South Korea |
| `IND` | India |
| `IDN` | Indonesia |
| `THA` | Thailand |
| `VNM` | Vietnam |
| `PHL` | Philippines |
| `MMR` | Myanmar |
| `BGD` | Bangladesh |
| `LKA` | Sri Lanka |
| `NZL` | New Zealand |
| `CAN` | Canada |
| `DEU` | Germany |
| `FRA` | France |
| `NLD` | Netherlands |
| `CHE` | Switzerland |
| `HKG` | Hong Kong |
| `TWN` | Taiwan |
| `ARE` | United Arab Emirates |
| `SAU` | Saudi Arabia |

> The SDK accepts any ISO 3166-1 alpha-3 code. The list above is a subset of the most commonly used.

---

## Currency codes

Selected ISO 4217 codes:

| Code | Currency |
|---|---|
| `MYR` | Malaysian Ringgit |
| `USD` | US Dollar |
| `SGD` | Singapore Dollar |
| `EUR` | Euro |
| `GBP` | British Pound |
| `AUD` | Australian Dollar |
| `JPY` | Japanese Yen |
| `CNY` | Chinese Renminbi |
| `HKD` | Hong Kong Dollar |
| `INR` | Indian Rupee |
| `IDR` | Indonesian Rupiah |
| `THB` | Thai Baht |
| `PHP` | Philippine Peso |
| `AED` | UAE Dirham |
| `SAR` | Saudi Riyal |

When billing in any currency other than `MYR`, provide an exchange rate to MYR in `.currency(code, rate)`.

---

## Identification types (`identificationType`)

| Code | Description |
|---|---|
| `BRN` | Business Registration Number |
| `NRIC` | National Registration Identity Card |
| `PASSPORT` | Passport number |
| `ARMY` | Malaysian Armed Forces ID |

---

## Runtime validation

The SDK provides helpers for runtime code lookup:

```typescript
import {
  VALID_STATE_CODES,
  isKnownMsic,
} from '@obsidia-my/myinvois-sdk/codes';

// Check a state code
const isValid = VALID_STATE_CODES.has('14');  // true

// Check an MSIC code
const known = isKnownMsic('62010');  // true (Software development)
```
