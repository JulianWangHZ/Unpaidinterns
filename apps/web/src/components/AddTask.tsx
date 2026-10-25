import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

export function AddTask({ onCreate }: { onCreate(title: string): Promise<void> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  if (!open) {
    return (
      <button type="button" className="add" onClick={() => setOpen(true)}>
        + {t('board.add')}
      </button>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === '') return;
    await onCreate(title.trim());
    setTitle('');
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <input
        autoFocus
        value={title}
        maxLength={200}
        placeholder={t('board.addPlaceholder')}
        aria-label={t('board.addPlaceholder')}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <div className="row-actions">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
          {t('board.cancel')}
        </button>
        <button type="submit" className="btn">
          {t('board.create')}
        </button>
      </div>
    </form>
  );
}
