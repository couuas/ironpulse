import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, Filter, Info, X } from 'lucide-react';
import { Exercise, MuscleGroup, MUSCLE_GROUP_LABELS, EquipmentType, EQUIPMENT_LABELS } from '../../types/workout';
import { db } from '../../db/db';

export const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeDetailExercise, setActiveDetailExercise] = useState<Exercise | null>(null);

  // 新增动作表单状态
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('chest');
  const [newEquipment, setNewEquipment] = useState<EquipmentType>('barbell');
  const [newNotes, setNewNotes] = useState('');
  const [newRest, setNewRest] = useState(90);

  const loadExercises = async () => {
    const list = await db.exercises.toArray();
    setExercises(list);
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchQuery || 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (ex.nameEn && ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMuscle = selectedMuscle === 'all' || ex.targetMuscle === selectedMuscle;
    const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newEx: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name: newName.trim(),
      nameEn: newNameEn.trim() || undefined,
      targetMuscle: newMuscle,
      secondaryMuscles: [],
      equipment: newEquipment,
      defaultRestSeconds: newRest,
      isCustom: true,
      notes: newNotes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.exercises.add(newEx);
    setIsNewModalOpen(false);
    setNewName('');
    setNewNameEn('');
    setNewNotes('');
    loadExercises();
  };

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 头部与新增按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            科学动作库
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            共包含 {exercises.length} 个标准力量动作与个人自定义库
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>自定义动作</span>
        </button>
      </div>

      {/* 搜索栏 */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
        <input
          type="text"
          placeholder="搜索动作名称、英文别名 (如: 卧推, OHP, 弯举)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 16px 11px 42px',
            fontSize: '14px',
            borderRadius: '12px'
          }}
        />
      </div>

      {/* 肌群横向过滤 Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '14px',
        scrollbarWidth: 'none'
      }}>
        <button
          onClick={() => setSelectedMuscle('all')}
          style={filterTabStyle(selectedMuscle === 'all')}
        >
          全部肌群
        </button>
        {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedMuscle(key)}
            style={filterTabStyle(selectedMuscle === key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 器械类型快捷标签 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)', alignSelf: 'center', marginRight: '4px' }}>
          器械:
        </span>
        <button
          onClick={() => setSelectedEquipment('all')}
          style={equipmentChipStyle(selectedEquipment === 'all')}
        >
          全部
        </button>
        {Object.entries(EQUIPMENT_LABELS).map(([eq, label]) => (
          <button
            key={eq}
            onClick={() => setSelectedEquipment(eq)}
            style={equipmentChipStyle(selectedEquipment === eq)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 动作列表卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredExercises.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            color: 'var(--text-muted)'
          }}>
            未找到匹配的训练动作
          </div>
        ) : (
          filteredExercises.map(ex => (
            <div
              key={ex.id}
              onClick={() => setActiveDetailExercise(ex)}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                    {ex.name}
                  </span>
                  {ex.isCustom && (
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--tech-blue)' }}>
                      自定义
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                  {ex.nameEn ? `${ex.nameEn} · ` : ''}
                  {EQUIPMENT_LABELS[ex.equipment]} · 默认休息 {ex.defaultRestSeconds}s
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge-neon">
                  {MUSCLE_GROUP_LABELS[ex.targetMuscle]}
                </span>
                <Info size={16} color="var(--text-dim)" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 动作详情弹窗 Modal */}
      {activeDetailExercise && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeDetailExercise.name}
                </h3>
              </div>
              <button onClick={() => setActiveDetailExercise(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {activeDetailExercise.nameEn && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {activeDetailExercise.nameEn}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className="badge-neon">主练: {MUSCLE_GROUP_LABELS[activeDetailExercise.targetMuscle]}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                器械: {EQUIPMENT_LABELS[activeDetailExercise.equipment]}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                组间建议: {activeDetailExercise.defaultRestSeconds}s
              </span>
            </div>

            {activeDetailExercise.notes && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-dim)',
                fontSize: '13px',
                color: 'var(--text-main)',
                lineHeight: 1.6,
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: 700, marginBottom: '4px' }}>
                  💡 动作要点与注意事项
                </div>
                {activeDetailExercise.notes}
              </div>
            )}

            <button
              onClick={() => setActiveDetailExercise(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--neon-green)',
                color: '#07080b',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 新建自定义动作 Modal */}
      {isNewModalOpen && (
        <div style={modalOverlayStyle}>
          <form onSubmit={handleCreateCustomExercise} style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                创建自定义动作
              </h3>
              <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  动作名称 (必填)
                </label>
                <input
                  type="text"
                  placeholder="例如: 哑铃仰卧上拉"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  英文名称 (选填)
                </label>
                <input
                  type="text"
                  placeholder="Dumbbell Pullover"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    主练肌群
                  </label>
                  <select
                    value={newMuscle}
                    onChange={e => setNewMuscle(e.target.value as MuscleGroup)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  >
                    {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    器械类型
                  </label>
                  <select
                    value={newEquipment}
                    onChange={e => setNewEquipment(e.target.value as EquipmentType)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  >
                    {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  默认组间休息 (秒)
                </label>
                <input
                  type="number"
                  value={newRest}
                  onChange={e => setNewRest(parseInt(e.target.value) || 60)}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  动作注意事项 / 个人心得
                </label>
                <textarea
                  rows={3}
                  placeholder="如: 手肘保持微屈，动作幅度不要过大..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--neon-green)',
                color: '#07080b',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              保存至动作库
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const filterTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: active ? 700 : 500,
  whiteSpace: 'nowrap',
  backgroundColor: active ? 'var(--neon-green)' : 'var(--bg-surface)',
  color: active ? '#07080b' : 'var(--text-muted)',
  border: active ? 'none' : '1px solid var(--border-dim)',
  cursor: 'pointer'
});

const equipmentChipStyle = (active: boolean): React.CSSProperties => ({
  padding: '3px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: active ? 600 : 500,
  backgroundColor: active ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface)',
  color: active ? 'var(--neon-green)' : 'var(--text-dim)',
  border: active ? '1px solid var(--neon-green)' : '1px solid var(--border-dim)',
  cursor: 'pointer'
});

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  backgroundColor: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: '20px',
  border: '1px solid var(--border-light)',
  padding: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  animation: 'badgePop 0.2s ease-out'
};
