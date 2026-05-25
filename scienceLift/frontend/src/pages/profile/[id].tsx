import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  const userId = id ? parseInt(id as string) : currentUser?.id;

  const [profile, setProfile] = useState<any>(null);
  const [reposts, setReposts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (profile) {
      loadReposts();
    }
  }, [profile, page]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      if (userId === currentUser?.id) {
        response = await apiClient.getMyProfile();
      } else {
        response = await apiClient.getProfile(userId!);
      }
      // Force refresh by adding cache buster timestamp
      if (response.data.profile_picture_url && !response.data.profile_picture_url.includes('data:')) {
        response.data.profile_picture_url = response.data.profile_picture_url + '?t=' + Date.now();
      }
      if (response.data.banner_picture_url && !response.data.banner_picture_url.includes('data:')) {
        response.data.banner_picture_url = response.data.banner_picture_url + '?t=' + Date.now();
      }
      setProfile(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReposts = async () => {
    try {
      console.log('Loading reposts...');
      const response = await apiClient.getUserReposts(page * 10, 10);
      console.log('Reposts response:', response);
      console.log('Items:', response.data.items);
      setReposts(response.data.items || []);
    } catch (err: any) {
      console.error('Error loading reposts:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
        {/* Animated background grid */}
        <div className="fixed inset-0 opacity-10 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
          }} />
        </div>

        <Header />
        <Sidebar onCategorySelect={() => {}} currentCategory={null} />
        <div className="ml-64 pt-20 px-6 pb-12 relative z-10">
          <div className="max-w-3xl mx-auto text-center py-16 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-purple-500/20 shadow-lg dark:shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Error Loading Profile</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-8 text-lg">{error}</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      <Header />
      <Sidebar onCategorySelect={setSelectedCategory} currentCategory={selectedCategory} />
      
      <div className="ml-64 pt-20 px-6 pb-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header Banner & Profile Section */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl overflow-hidden border border-gray-200 dark:border-purple-500/20">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 relative overflow-hidden">
              {profile.banner_picture_url ? (
                <img
                  src={profile.banner_picture_url}
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              ) : null}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="absolute top-4 right-6 px-5 py-2 bg-white dark:bg-slate-700 text-blue-600 dark:text-purple-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 font-semibold text-sm shadow-md transition transform hover:scale-105"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Profile Info Container */}
            <div className="px-8 py-6">
              {/* Avatar + Basic Info Row */}
              <div className="flex gap-6 mb-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white overflow-hidden shadow-lg">
                    {profile.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23cbd5e1" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="50" font-weight="bold"%3E' + profile.username[0].toUpperCase() + '%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold">
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{profile.username}</h1>
                    {profile.is_admin && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-full">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm font-medium mb-2">u/{profile.username.toLowerCase()}</p>
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <p className="text-gray-600 dark:text-slate-400 text-xs font-medium">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Reposts Section */}
          {isOwnProfile && (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mt-6 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
                <h3 className="font-bold text-gray-900 dark:text-slate-100">MY REPOSTS</h3>
              </div>

              {/* Content */}
              <div>
                {(selectedCategory 
                  ? reposts.filter(r => r.paper?.category === selectedCategory) 
                  : reposts
                ).length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <p className="text-gray-600 dark:text-slate-300 text-lg font-medium mb-2">
                      {selectedCategory ? `No ${selectedCategory} reposts` : 'No reposts yet'}
                    </p>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                      {selectedCategory 
                        ? 'This user hasn\'t reposted any papers in this category'
                        : 'This user hasn\'t reposted any papers'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedCategory 
                      ? reposts.filter(r => r.paper?.category === selectedCategory) 
                      : reposts
                    ).map((repost) => (
                      <div key={repost.id} className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-purple-500/20 rounded-lg hover:border-blue-300 dark:hover:border-purple-400/50 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all">
                        {repost.paper && (
                          <>
                            {/* Paper Title and Meta */}
                            <div className="p-4">
                              <div className="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                                <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                                  {repost.paper.category}
                                </span>
                                Reposted {new Date(repost.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              
                              <Link href={`/paper/${repost.paper.id}`}>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 dark:hover:from-blue-400 hover:to-purple-600 dark:hover:to-purple-400 mb-2 line-clamp-2 cursor-pointer transition">
                                  {repost.paper.title}
                                </h3>
                              </Link>
                              
                              <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-3 mb-3">
                                {repost.paper.ai_summary || 'No summary available'}
                              </p>

                              {repost.paper.authors && (
                                <p className="text-xs text-gray-500 dark:text-slate-500 mb-2 font-medium">
                                  by {repost.paper.authors}
                                </p>
                              )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50">
                              <div className="flex gap-6 text-sm text-gray-600 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  👍 {repost.paper.likes_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  💬 {repost.paper.comments_count || 0}
                                </span>
                              </div>
                              <Link 
                                href={`/paper/${repost.paper.id}`}
                                className="text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 font-medium text-sm transition"
                              >
                                View Discussion →
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
