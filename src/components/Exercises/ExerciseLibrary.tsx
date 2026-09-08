import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Info, X, Dumbbell } from 'lucide-react';
import { Exercise, MuscleGroup, MUSCLE_GROUP_LABELS, EquipmentType, EQUIPMENT_LABELS } from '../../types/workout';
import { db } from '../../db/db';
import { syncService } from '../../services/syncService';

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
    const rawList = await db.exercises.toArray();
    setExercises(rawList.filter(ex => !ex.isDeleted));
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

    const now = Date.now();
    const newEx: Exercise = {
      id: `ex-custom-${now}`,
      name: newName.trim(),
      nameEn: newNameEn.trim() || undefined,
      targetMuscle: newMuscle,
      secondaryMuscles: [],
      equipment: newEquipment,
      defaultRestSeconds: newRest,
      isCustom: true,
      notes: newNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      syncStatus: 1, // PENDING_CREATE
      isDeleted: false
    };

    await db.exercises.add(newEx);
    await syncService.refreshPendingCount();
    setIsNewModalOpen(false);
    setNewName('');
    setNewNameEn('');
    setNewNotes('');
    loadExercises();
  };

  return (
    <div className="desktop-workstation-container">
      {/* 头部与新增按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            科学力量动作库
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            收录 {exercises.length} 个解剖学力量动作 · 支持多端离线智能检索与个性化扩展
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 0 12px var(--neon-green-glow)'
          }}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>自定义动作</span>
        </button>
      </div>

      {/* 搜索栏与过滤面板 */}
      <div style={{
        padding: '20px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}>
        {/* 搜索框 */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input
            type="text"
            placeholder="搜索动作中文名称、英文别名 (如: 卧推, OHP, 深蹲, 划船, 弯举)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 18px 12px 46px',
              fontSize: '14px',
              borderRadius: 'var(--radius-sm)'
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, marginRight: '4px' }}>
            器械分类:
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
      </div>

      {/* 大屏多列动作卡片网格 (支持 280px 移动端自适应) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredExercises.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)'
          }}>
            未找到匹配的训练动作，请尝试更换检索关键词
          </div>
        ) : (
          filteredExercises.map(ex => (
            <div
              key={ex.id}
              onClick={() => setActiveDetailExercise(ex)}
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--neon-green)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                    {ex.name}
                  </span>
                  <span className="badge-neon">
                    {MUSCLE_GROUP_LABELS[ex.targetMuscle]}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {ex.nameEn || 'Standard Exercise'}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-dim)'
              }}>
                <span>器械: <b style={{ color: 'var(--text-secondary)' }}>{EQUIPMENT_LABELS[ex.equipment]}</b></span>
                <span>建议休息: <b style={{ color: 'var(--text-secondary)' }}>{ex.defaultRestSeconds}s</b></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 动作要点详情弹窗 Modal */}
      {activeDetailExercise && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeDetailExercise.name}
                </h3>
              </div>
              <button onClick={() => setActiveDetailExercise(null)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {activeDetailExercise.nameEn && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {activeDetailExercise.nameEn}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <span className="badge-neon">主练: {MUSCLE_GROUP_LABELS[activeDetailExercise.targetMuscle]}</span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}>
                器械: {EQUIPMENT_LABELS[activeDetailExercise.equipment]}
              </span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}>
                默认休息: {activeDetailExercise.defaultRestSeconds}s
              </span>
            </div>

            {activeDetailExercise.notes && (
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: 'var(--text-main)',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: 800, marginBottom: '6px' }}>
                  💡 动作解剖要点与发力技巧
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
                fontWeight: 800,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                创建自定义动作
              </h3>
              <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  动作名称 (必填)
                </label>
                <input
                  type="text"
                  placeholder="例如: 哑铃仰卧上拉"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  英文名称 (选填)
                </label>
                <input
                  type="text"
                  placeholder="Dumbbell Pullover"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    主练肌群
                  </label>
                  <select
                    value={newMuscle}
                    onChange={e => setNewMuscle(e.target.value as MuscleGroup)}
                    style={{ width: '100%', padding: '11px 12px' }}
                  >
                    {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    器械类型
                  </label>
                  <select
                    value={newEquipment}
                    onChange={e => setNewEquipment(e.target.value as EquipmentType)}
                    style={{ width: '100%', padding: '11px 12px' }}
                  >
                    {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  默认组间休息 (秒)
                </label>
                <input
                  type="number"
                  value={newRest}
                  onChange={e => setNewRest(parseInt(e.target.value) || 60)}
                  style={{ width: '100%', padding: '11px 14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  动作注意事项 / 个人心得
                </label>
                <textarea
                  rows={3}
                  placeholder="手肘保持微屈，动作顶峰收缩挤压背阔肌..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px' }}
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
                fontWeight: 800,
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
  padding: '7px 16px',
  borderRadius: 'var(--radius-full)',
  fontSize: '12px',
  fontWeight: active ? 800 : 500,
  whiteSpace: 'nowrap',
  backgroundColor: active ? 'var(--neon-green)' : 'var(--bg-surface-hover)',
  color: active ? '#07080b' : 'var(--text-secondary)',
  border: active ? 'none' : '1px solid var(--border-subtle)',
  cursor: 'pointer'
});

const equipmentChipStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 12px',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: active ? 700 : 500,
  backgroundColor: active ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface-hover)',
  color: active ? 'var(--neon-green)' : 'var(--text-dim)',
  border: active ? '1px solid var(--neon-green)' : '1px solid var(--border-subtle)',
  cursor: 'pointer'
});

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-light)',
  padding: '28px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
  animation: 'badgePop 0.2s ease-out'
};
