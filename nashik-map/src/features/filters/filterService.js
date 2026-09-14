import filterData from '../../data/nashikFilters.json';

export const FILTER_GROUPS = [
  ['WardMaster', 'Ward'], ['HealthCondition', 'Health Condition'], ['LandOwnership', 'Land Ownership'],
  ['EnvironmentalParameters', 'Environmental Parameters'], ['StructuralParameters', 'Structural Parameters'],
  ['IUCN_Status', 'IUCN Status'], ['EconomicImp', 'Economic Impact'], ['AdditionalParamaters', 'Additional Parameters'],
  ['AgeGroup', 'Age Group'], ['LocalName', 'Tree Species'], ['TreeLocation', 'Tree Location'],
];

export function getFilterOptions(group) {
  return filterData[group] || [];
}

const escapeCql = (value) => String(value).replace(/'/g, "''");

export function getCqlFilter(filters = {}) {
  const clauses = Object.entries(filters)
    .map(([key, rawValues]) => {
      if (!Array.isArray(rawValues) || rawValues.length === 0) return null;
      const values = rawValues.map((value) => escapeCql(value));

      switch (key) {
        case 'WardMaster':
          return `WardNameOrNum IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'HealthCondition':
          return `HealthCondition IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'LandOwnership':
          return `OwnershipOfLand IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'EnvironmentalParameters':
        case 'StructuralParameters':
          return `(${values.map((v) => `TreeAttributesJson ILIKE '%${v}%'`).join(' OR ')})`;
        case 'IUCN_Status':
          return `IUCN_Status IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'EconomicImp':
          return `EconomicImp IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'AdditionalParamaters': {
          const additionalConditions = values.flatMap((value) => {
            switch (value) {
              case 'Medicinal Usage': return ["MedicinalUsage = 'Yes'"];
              case 'Pollution Tollerent':
              case 'Pollution Tolerant': return ["Pollution_Air_pollution_Carbon_Absorb = 'Pollution Tollerent'"];
              case 'Temperature Control': return ["TempControl = 'Yes'"];
              case 'Butterfly Associated Plants': return ["Butterfly_Associated_Plants = 'Yes'"];
              default: return [];
            }
          });
          return additionalConditions.length ? `(${additionalConditions.join(' OR ')})` : null;
        }
        case 'AgeGroup':
          return `AgeGroup IS NOT NULL AND AgeGroup IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'LocalName':
          return `LocalName IN (${values.map((v) => `'${v}'`).join(',')})`;
        case 'TreeLocation':
          return `TreeLocation IS NOT NULL AND TreeLocation IN (${values.map((v) => `'${v}'`).join(',')})`;
        default:
          return null;
      }
    })
    .filter(Boolean);

  return clauses.join(' AND ');
}
