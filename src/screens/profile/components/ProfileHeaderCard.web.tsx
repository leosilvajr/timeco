import React from 'react';
import { HtmlCard, HtmlAvatar } from '../../../components/web';
import { useThemedColors } from '../../../store';
import { ProfileCompletion } from '../../../hooks/useProfileCompletion';
import { User } from '../../../types';

interface Props {
  user: User;
  completion: ProfileCompletion;
  onAvatarClick: () => void;
}

/**
 * Card de identidade do usuario no topo do ProfileHome: avatar, nome,
 * email, badge de superadmin, e barra de progresso de completude.
 */
export const ProfileHeaderCard: React.FC<Props> = ({
  user,
  completion,
  onAvatarClick,
}) => {
  const c = useThemedColors();
  return (
    <HtmlCard style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onAvatarClick}
          disabled={!user.photoURL}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: user.photoURL ? 'pointer' : 'default',
            padding: 0,
            display: 'inline-flex',
          }}
        >
          <HtmlAvatar name={user.name} photoURL={user.photoURL} size={88} />
        </button>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: c.text, marginTop: 6 }}>
        {user.name}
      </div>
      <div style={{ fontSize: 14, color: c.textSecondary }}>{user.email}</div>
      {user.role === 'superadmin' ? (
        <span
          style={{
            display: 'inline-block',
            marginTop: 6,
            padding: '4px 10px',
            background: c.secondary,
            color: c.black,
            fontWeight: 800,
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          👑 Super admin
        </span>
      ) : null}
      <div style={{ width: '100%', marginTop: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: c.textSecondary,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          Cadastro {completion.percent}% completo
          {completion.isComplete ? ' ✅' : ''}
        </div>
        <div
          style={{
            height: 6,
            background: c.border,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${completion.percent}%`,
              background: c.primary,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </HtmlCard>
  );
};
