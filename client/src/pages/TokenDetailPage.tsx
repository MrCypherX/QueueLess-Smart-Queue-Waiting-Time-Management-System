import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Token } from '../../../shared/schemas';
import { TokenTracker } from '../components/TokenTracker';
import { LoadingSpinner, EmptyState } from '../components/Common';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TokenDetailPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { user } = useAuth();
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadToken = async () => {
    if (!tokenId) return;
    try {
      const data = await api.tokens.get(tokenId);
      setToken(data);
    } catch (err: any) {
      setError(err.message || 'Token not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadToken();

    // Polling fallback every 10 seconds for ultra-reliability
    const timer = setInterval(() => {
      loadToken();
    }, 10000);

    return () => clearInterval(timer);
  }, [tokenId]);

  if (isLoading) {
    return <LoadingSpinner message="Fetching live queue status & position..." />;
  }

  if (error || !token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          title="Token Not Found"
          description={error || 'We could not locate this token. It may have expired or been removed.'}
          actionText="Find Facilities"
          onAction={() => (window.location.href = '/locations')}
        />
      </div>
    );
  }

  const isOwner = user && token.user_id === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/locations" className="hover:text-white transition-colors">
          Facilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white font-medium">Token {token.token_number}</span>
      </div>

      {/* Flagship Token Tracker Component */}
      <TokenTracker
        initialToken={token}
        onRefresh={loadToken}
        canCancel={Boolean(isOwner)}
      />
    </div>
  );
};
