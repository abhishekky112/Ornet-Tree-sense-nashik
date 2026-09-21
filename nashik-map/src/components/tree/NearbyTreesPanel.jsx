import { useState } from 'react';
import { AlertCircle, Camera, CircleX, ExternalLink, FileSearch, LocateFixed, Maximize2, Ruler, SearchX, TreePine, X } from 'lucide-react';

const get = (p, ...keys) => keys.map((key) => p?.[key]).find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '—';

const AZURE_BLOB_BASE = 'https://treecensus.blob.core.windows.net/nashik/';

export function resolveTreePhotoUrl(rawPhoto) {
  if (!rawPhoto || rawPhoto === '—') return '';
  const trimmed = String(rawPhoto).trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('https://treecensus.blob.core.windows.net/')) {
    return trimmed;
  }

  const legacyMatch = trimmed.match(/^https?:\/\/103\.14\.97\.\d+\/treecensusapi\/uploads\/(.*)$/i);
  if (legacyMatch) {
    return `${AZURE_BLOB_BASE}${legacyMatch[1]}`;
  }

  if (trimmed.startsWith('NASHIK/') || trimmed.startsWith('tree/')) {
    return `${AZURE_BLOB_BASE}${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `${AZURE_BLOB_BASE}${trimmed}`;
}

function formatDate(value) {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB').replace(/\//g, '-');
}

function TreeField({ label, value }) {
  return <div className="py-2">
    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="mt-0.5 break-words text-xs font-medium leading-5 text-slate-700">{value}</dd>
  </div>;
}

function TreeCard({ feature, distance, active, onSelect, onViewPhoto }) {
  const [imgError, setImgError] = useState(false);
  const p = feature.properties || {};
  const uid = get(p, 'Tree_UID', 'TreeUID', 'TreeUid');
  const name = get(p, 'LocalName', 'HindiName');
  const health = get(p, 'HealthCondition');
  const age = get(p, 'AgeGroup');
  const height = get(p, 'Height');
  const girth = get(p, 'Girth');
  const canopy = get(p, 'Canopy');
  const latitude = get(p, 'Latitude', 'Lattitude');
  const longitude = get(p, 'Longitude');
  const surveyDate = formatDate(get(p, 'AddedDate', 'SurveyDate'));
  const executiveCode = get(p, 'Executive_Cd');
  const surveyBy = executiveCode === '—' || executiveCode === '0' || executiveCode === 0 ? 'User-2209' : `User-${executiveCode}`;
  const photo = get(p, 'TreePhoto', 'TreePhotoURL', 'Photo');
  const photoUrl = resolveTreePhotoUrl(photo);

  return <article className={`overflow-hidden rounded-xl border bg-white shadow-sm ${active ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'}`}>
    <div role="button" tabIndex={0} className="w-full cursor-pointer text-left" onClick={() => onSelect(feature)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(feature); }}>
      <div className="flex gap-3 p-3.5">
        <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {photoUrl && !imgError ? <>
            <img className="h-full w-full object-cover" src={photoUrl} alt={`${name} tree`} loading="lazy" onError={() => setImgError(true)} />
            <button type="button" onClick={(event) => { event.stopPropagation(); onViewPhoto({ url: photoUrl, name, uid }); }} className="absolute inset-0 grid place-items-center bg-slate-950/45 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label={`View ${name} photo larger`}>
              <span className="flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm"><Maximize2 size={14} /> View</span>
            </button>
          </> : <div className="grid h-full w-full place-items-center text-emerald-600"><TreePine size={28} strokeWidth={1.7} /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-tight text-slate-900">{name}</h3>
              <p className="mt-1 break-all font-mono text-[10px] leading-4 text-slate-500">{uid}</p>
            </div>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold tabular-nums text-slate-600">{distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}</span>
          </div>
          <p className="mt-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">Health</span><span className="mx-1.5 text-slate-300">·</span>{health}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 px-3.5">
        <TreeField label="Age" value={age !== '—' ? `${age} yrs` : '—'} />
        <TreeField label="Height" value={height !== '—' ? `${height} ft` : '—'} />
        <TreeField label="Girth" value={girth !== '—' ? `${girth} in` : '—'} />
        <TreeField label="Canopy" value={canopy !== '—' ? `${Math.round(Number(canopy)) || canopy} sq. ft.` : '—'} />
        <TreeField label="Latitude" value={latitude} />
        <TreeField label="Longitude" value={longitude} />
        <TreeField label="Survey date" value={surveyDate} />
        <TreeField label="Survey by" value={surveyBy} />
      </dl>
    </div>
  </article>;
}

export default function NearbyTreesPanel({ data, loading, error, onClose, selectedTree, onSelect }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  if (!data && !loading && !error) return null;
  const features = data?.features || [];
  const radius = data?.radius || 150;

  return <>
    <aside className="absolute bottom-4 right-4 top-4 z-10 flex w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <header className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700"><LocateFixed size={12} /> Map selection</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Nearby trees</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Ruler size={12} />{loading ? 'Searching around your click…' : `${features.length} trees found within ${radius} m`}</p>
        </div>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onClose} aria-label="Close nearby trees"><X size={16} /></button>
      </header>
      {loading && <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"><SearchX size={28} className="text-slate-300" /><strong className="text-sm text-slate-800">Finding trees nearby</strong><span className="text-xs text-slate-500">Querying the Nashik tree inventory…</span></div>}
      {error && <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"><AlertCircle size={30} className="text-red-500" /><strong className="text-sm text-slate-800">Couldn’t load nearby trees</strong><span className="text-xs text-slate-500">{error}</span></div>}
      {!loading && !error && features.length === 0 && <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"><SearchX size={30} className="text-slate-300" /><strong className="text-sm text-slate-800">No trees in this area</strong><span className="text-xs text-slate-500">Try clicking another location or zooming in/out.</span></div>}
      {!loading && !error && features.length > 0 && <><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-medium text-slate-500"><span className="flex items-center gap-1.5"><FileSearch size={12} /> Sorted by distance</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">{features.length}</span></div><div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-2">{features.map((feature) => <TreeCard key={feature.id || JSON.stringify(feature.geometry)} feature={feature} distance={feature._distance || 0} active={selectedTree === feature} onSelect={onSelect} onViewPhoto={setPhotoPreview} />)}</div></>}
    </aside>

    {photoPreview && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-6" role="dialog" aria-modal="true" aria-label="Tree photo preview" onClick={() => setPhotoPreview(null)}>
      <div className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Camera size={16} className="text-emerald-600" />{photoPreview.name}</p><p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{photoPreview.uid}</p></div>
          <div className="ml-4 flex items-center gap-1">
            <a href={photoPreview.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Open image in new window"><ExternalLink size={15} /></a>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setPhotoPreview(null)} aria-label="Close photo preview"><CircleX size={17} /></button>
          </div>
        </div>
        <div className="max-h-[calc(92vh-64px)] overflow-auto bg-slate-950/5 p-3"><img src={photoPreview.url} alt={`${photoPreview.name} tree`} className="mx-auto max-h-[calc(92vh-90px)] max-w-full object-contain" /></div>
      </div>
    </div>}
  </>;
}
