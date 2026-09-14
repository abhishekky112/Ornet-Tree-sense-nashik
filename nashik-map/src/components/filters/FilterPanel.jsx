import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, HeartPulse, Layers3, Leaf, MapPinned, Search, SlidersHorizontal, Sprout, TreePine } from 'lucide-react';
import { FILTER_GROUPS, getFilterOptions } from '../../features/filters/filterService';

const label = (item) => item.Dvalue ?? item.DValue ?? item.WardNameOrNum ?? item.IUCN_Status ?? item.EconomicImp ?? item.LocalName ?? item.TreeLocation ?? item;
const value = (item) => item.WardNameOrNum ?? item.Dvalue ?? item.DValue ?? item.IUCN_Status ?? item.EconomicImp ?? item.LocalName ?? item.TreeLocation ?? item;

export default function FilterPanel({ filters, onChange, onClear }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const groups = useMemo(() => FILTER_GROUPS.map(([key, title]) => ({ key, title, options: getFilterOptions(key) })), []);
  const activeCount = Object.values(filters).flat().length;
  const icons = {
    WardMaster: MapPinned,
    HealthCondition: HeartPulse,
    LandOwnership: Layers3,
    EnvironmentalParameters: Leaf,
    StructuralParameters: SlidersHorizontal,
    IUCN_Status: Sprout,
    EconomicImp: Layers3,
    AdditionalParamaters: Sprout,
    AgeGroup: SlidersHorizontal,
    LocalName: TreePine,
    TreeLocation: MapPinned,
  };

  if (collapsed) {
    return <button
      className="filter-rail-button"
      onClick={() => setCollapsed(false)}
      aria-label={`Open filters, ${activeCount} active`}
      title={`Filters · ${activeCount} active`}
    >
      <span className="filter-rail-icon"><Filter size={19} strokeWidth={2.1} /></span>
      {activeCount > 0 && <span className="filter-rail-count">{activeCount}</span>}
    </button>;
  }

  return <aside className="filter-panel">
    <div className="filter-head">
      <div>
        <div className="eyebrow">NASHIK INVENTORY</div>
        <h2>Explore trees</h2>
        <p>Filter the live GeoServer layer</p>
      </div>
      <button className="icon-button" onClick={() => setCollapsed(true)} aria-label="Collapse filters" title="Collapse filters">
        <ChevronLeft size={18} />
      </button>
    </div>
    <div className="filter-summary">
      <span><b>{activeCount}</b> active filters</span>
      <button onClick={onClear} disabled={!activeCount}>Reset all</button>
    </div>
    <label className="filter-search">
      <Search size={16} aria-hidden="true" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filter values…" />
      <kbd>/</kbd>
    </label>
    <div className="filter-groups">
      {groups.map(({ key, title, options }) => {
        const selected = filters[key] || [];
        const visible = options.filter((item) => label(item).toLowerCase().includes(query.toLowerCase()));
        const Icon = icons[key] || Filter;
        return <details key={key} open={['WardMaster', 'HealthCondition', 'LandOwnership'].includes(key)}>
          <summary>
            <span className="group-icon"><Icon size={16} strokeWidth={2} /></span>
            <span className="group-title">{title}</span>
            {selected.length > 0 && <em>{selected.length}</em>}
            <small>{options.length}</small>
          </summary>
          <div className="filter-options">
            {visible.map((item) => {
              const v = value(item);
              return <label key={v} className={selected.includes(v) ? 'checked' : ''}>
                <input type="checkbox" checked={selected.includes(v)} onChange={() => onChange(key, v)} />
                <span className="checkmark" />
                <span>{label(item)}</span>
              </label>;
            })}
          </div>
          {query && visible.length === 0 && <div className="no-options">No matching values</div>}
        </details>;
      })}
    </div>
  </aside>;
}
