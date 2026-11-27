import React, { useId } from 'react';

export default function SkillSelector({
  label,
  required = false,
  skills = [],
  selectedSkillId,
  onSelectSkillId,
  customSkillName,
  onCustomSkillNameChange,
  isCustomMode,
  onToggleCustomMode,
  loading = false
}) {
  const datalistId = useId();
  const hasCatalog = Array.isArray(skills) && skills.length > 0;
  const showWriteInput = isCustomMode || (!loading && !hasCatalog);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      onToggleCustomMode(true);
      onSelectSkillId('');
    } else {
      onSelectSkillId(val);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-[11px] font-medium text-slate-300">
          {label} {required && <span className="text-[#A3E635]">*</span>}
        </label>
        {hasCatalog && (
          <button
            type="button"
            onClick={() => {
              const nextMode = !isCustomMode;
              onToggleCustomMode(nextMode);
              if (nextMode) {
                onSelectSkillId('');
              } else {
                onCustomSkillNameChange('');
              }
            }}
            className="text-[10px] font-semibold text-[#A3E635] hover:text-[#BEF264] transition-colors"
          >
            {isCustomMode ? 'Choose from list' : '+ Write custom'}
          </button>
        )}
      </div>

      {showWriteInput ? (
        <div>
          <input
            type="text"
            list={hasCatalog ? datalistId : undefined}
            value={customSkillName}
            onChange={(e) => onCustomSkillNameChange(e.target.value)}
            placeholder="Write skill name (e.g. React, Python, Docker)"
            className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
          />
          {hasCatalog && (
            <datalist id={datalistId}>
              {skills.map((s) => (
                <option key={s._id || s.id} value={s.name}>
                  {s.category}
                </option>
              ))}
            </datalist>
          )}
        </div>
      ) : (
        <select
          value={selectedSkillId}
          onChange={handleSelectChange}
          disabled={loading}
          className="w-full bg-[#0A0E13] border border-[#1F2937] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#A3E635]"
        >
          <option value="">
            {loading ? 'Loading skills...' : `-- Select a skill (${skills.length}) --`}
          </option>
          {skills.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name} ({s.category})
            </option>
          ))}
          <option value="__custom__">+ Write custom skill...</option>
        </select>
      )}
    </div>
  );
}
