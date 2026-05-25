import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PaperCard } from '@/components/PaperCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SavedPapersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadSavedPapers();
  }, [isAuthenticated]);

  const loadSavedPapers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSavedPapers();
      setSavedPapers(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load saved papers');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (paperId: number) => {
    try {
      await apiClient.unsavePaper(paperId);
      setSavedPapers(savedPapers.filter(p => p.id !== paperId));
    } catch (err: any) {
      alert('Failed to remove paper');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar onCategorySelect={setSelectedCategory} currentCategory={selectedCategory} />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {selectedCategory ? `${selectedCategory} - Saved Papers` : 'Saved Papers'}
              </h1>
              <p className="text-gray-400">
                {selectedCategory ? `${savedPapers.length} ${selectedCategory} papers saved` : `${savedPapers.length} papers saved`}
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            ) : (
              <>
                {(selectedCategory 
                  ? savedPapers.filter(p => p.category === selectedCategory) 
                  : savedPapers
                ).length === 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                    <p className="text-gray-400 mb-4">
                      {selectedCategory 
                        ? `No saved papers in ${selectedCategory}` 
                        : 'No saved papers yet'}
                    </p>
                    <a href="/search" className="text-blue-400 hover:text-blue-300 font-medium">
                      Explore papers →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(selectedCategory 
                      ? savedPapers.filter(p => p.category === selectedCategory) 
                      : savedPapers
                    ).map((paper: any) => (
                      <div key={paper.id} className="relative group">
                        <div className="flex-1">
                          <PaperCard
                            paper={paper}
                            onLike={(paperId, isLiked) => {
                              if (isLiked) {
                                apiClient.unlikePaper(paperId);
                              } else {
                                apiClient.likePaper(paperId);
                              }
                            }}
                            onRepost={(paperId, isReposted) => {
                              if (isReposted) {
                                apiClient.unrepostPaper(paperId);
                              } else {
                                apiClient.repostPaper(paperId);
                              }
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSaved(paper.id)}
                          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
