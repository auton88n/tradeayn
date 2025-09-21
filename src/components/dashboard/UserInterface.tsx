import React from 'react';
import { User } from '@supabase/supabase-js';
import { TermsModal } from '../TermsModal';
import { AccessStatusCard } from '../AccessStatusCard';

interface UserInterfaceProps {
  user: User;
  hasAcceptedTerms: boolean;
  hasAccess: boolean;
}

export default function UserInterface({ user, hasAcceptedTerms, hasAccess }: UserInterfaceProps) {
  if (!hasAcceptedTerms) {
    return <TermsModal open={true} onAccept={() => window.location.reload()} />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AccessStatusCard user={user} />
      </div>
    );
  }

  return null;
}