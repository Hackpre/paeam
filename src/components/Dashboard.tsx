import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('paeam_user');
    const paid = localStorage.getItem('paeam_paid');
    const savedSongs = localStorage.getItem('paeam_songs');
    
    if (userData) setUser(JSON.parse(userData));
    setPaymentStatus(paid);
    if (savedSongs) setSongs(JSON.parse(savedSongs));
  }, []);

  const addSong = () => {
    const title = prompt('Enter song title:');
    if (title) {
      const newSong = { id: Date.now(), title, status: 'pending_approval' };
      const updated = [...songs, newSong];
      setSongs(updated);
      localStorage.setItem('paeam_songs', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('paeam_user');
    localStorage.removeItem('paeam_paid');
    localStorage.removeItem('paeam_logged_in');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">PAEAM Dashboard</h1>
            <p className="text-gray-400 text-sm">Welcome, {user?.fullName || 'Producer'}!</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Sign Out</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {paymentStatus !== 'true' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-500 font-semibold">⚠️ Payment Pending: 15,000 MWK</p>
            <button onClick={() => window.location.href = '/payment'} className="mt-2 px-4 py-1 bg-gold-600 text-black rounded-lg">Complete Payment</button>
          </div>
        )}

        {paymentStatus === 'true' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <p className="text-green-500 font-semibold">✓ Payment Confirmed - Active Member</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-2xl font-bold text-white">{songs.length}</div>
            <div className="text-gray-400">Total Songs</div>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <div className="text-4xl mb-2">📄</div>
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-gray-400">Contracts</div>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <div className="text-4xl mb-2">🔐</div>
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-gray-400">Locked Records</div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Your Songs</h3>
            <button onClick={addSong} className="px-4 py-2 bg-gold-600 text-black rounded-lg">+ Add Song</button>
          </div>
          {songs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No songs yet. Add your first song!</p>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <div key={song.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="text-white">{song.title}</span>
                  <span className="text-xs text-yellow-500">Pending Approval</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}