import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { Settings, Shield, Bell, CheckCircle, Copy, Link as LinkIcon, AlertCircle, Plus, Camera } from 'lucide-react';

export default function Profile() {
  const { currentUser, userData } = useAuth();
  
  const [name, setName] = useState(userData?.name || '');
  const [goal, setGoal] = useState(userData?.financialGoal || '');
  const [risk, setRisk] = useState(userData?.riskAppetite || '');
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [photoPreview, setPhotoPreview] = useState(userData?.photoURL || null);

  const [notifications, setNotifications] = useState({
    emailLessonReminders: userData?.notifications?.emailLessonReminders ?? true,
    marketVolatilityAlerts: userData?.notifications?.marketVolatilityAlerts ?? true,
    communityMentions: userData?.notifications?.communityMentions ?? false
  });

  const [showBrokerModal, setShowBrokerModal] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setGoal(userData.financialGoal || '');
      setRisk(userData.riskAppetite || '');
      setPhotoPreview(userData.photoURL || null);
      if (userData.notifications) {
        setNotifications(userData.notifications);
      }
    }
  }, [userData]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", 'error');
      return;
    }

    try {
      const localURL = URL.createObjectURL(file);
      setPhotoPreview(localURL);

      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL: downloadURL });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { photoURL: downloadURL });

      showToast("Profile photo updated ✓", 'success');
    } catch (err) {
      console.error(err);
      showToast("Upload failed. Please try again.", 'error');
      setPhotoPreview(userData?.photoURL || null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        financialGoal: goal,
        riskAppetite: risk
      });
      showToast('Profile updated ✓');
    } catch (err) {
      showToast('Something went wrong', 'error');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setName(userData?.name || '');
    setGoal(userData?.financialGoal || '');
    setRisk(userData?.riskAppetite || '');
  };

  const toggleNotification = async (key) => {
    const newVal = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newVal }));
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`notifications.${key}`]: newVal
      });
    } catch (err) {
      setNotifications(prev => ({ ...prev, [key]: !newVal }));
      showToast('Failed to update preference', 'error');
    }
  };

  const copyReferral = () => {
    const code = userData?.referralCode || 'FINIQ-USER';
    navigator.clipboard.writeText(`finiq.in/ref/${code}`);
    showToast('Link copied! ✓');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'FI';
  };

  const renderHeatmap = () => {
    const days = 28;
    const grid = [];
    const log = userData?.activityLog || {};
    let totalActions = 0;
    
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().split("T")[0];
        const count = log[dateStr] || 0;
        totalActions += count;
        
        let bg = 'bg-gray-100';
        if (count >= 5) bg = 'bg-[#0a4732]';
        else if (count >= 3) bg = 'bg-[#1DB88E]';
        else if (count > 0) bg = 'bg-[#b3ecd8]';

        grid.push(<div key={i} title={`${count} actions on ${dateStr}`} className={`w-4 h-4 rounded-sm ${bg}`}></div>);
    }
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 flex-wrap">
          {grid}
        </div>
        <p className="text-xs text-gray-500 text-right">Current streak: {userData?.streakCount || 0} 🔥</p>
        {totalActions === 0 && (
          <p className="text-[10px] text-gray-400 text-center italic mt-1">Start learning to fill your heatmap!</p>
        )}
      </div>
    );
  };

  if (!userData) return <div className="min-h-screen pt-24 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-[#EAF0EC] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-xl text-white shadow-lg animate-slide-in ${toast.type === 'success' ? 'bg-[#1DB88E]' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {showBrokerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-in">
            <h3 className="text-xl font-bold text-[#0D2B1F] mb-4">Link New Brokerage</h3>
            <div className="space-y-3">
              {['HDFC Securities', 'Zerodha', 'Groww', 'Upstox', 'Angel One'].map(b => (
                <button key={b} onClick={() => { setShowBrokerModal(false); showToast(`Linked ${b} ✓`); }} className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#1DB88E] hover:bg-[#1DB88E]/5 transition-all text-left">
                  <span className="font-semibold text-gray-800">{b}</span>
                  <Plus size={18} className="text-[#1DB88E]" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowBrokerModal(false)} className="mt-6 w-full py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center">
            
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="h-24 w-24 rounded-full bg-[#1DB88E] flex items-center justify-center text-3xl font-bold text-white shadow-md relative group overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  getInitials(userData.name)
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <h2 className="mt-4 text-xl font-bold text-[#0D2B1F]">{userData.name || 'User'}</h2>
            <p className="text-gray-500 text-sm">{userData.email || currentUser.email}</p>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${userData.memberType === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              {userData.memberType === 'pro' ? 'GOLD PRO MEMBER' : 'FREE MEMBER'}
            </div>
            
            <div className="w-full mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Activity Heatmap</h3>
              {renderHeatmap()}
            </div>
          </div>

          <div className="bg-[#0D2B1F] rounded-3xl p-6 text-white text-center shadow-lg transform transition-all hover:-translate-y-1">
             <h3 className="text-lg font-bold mb-2">Refer a Friend</h3>
             <p className="text-sm text-gray-300 mb-4 cursor-pointer" onClick={copyReferral}>finiq.in/ref/{userData.referralCode || 'FINIQ-USER'}</p>
             <button onClick={copyReferral} className="w-full py-3 bg-[#1DB88E] hover:bg-white hover:text-[#0D2B1F] rounded-xl font-semibold transition-all flex justify-center items-center gap-2">
               <Copy size={18} /> COPY LINK
             </button>
             <p className="text-xs text-gray-400 mt-4">You've referred {userData.referralCount || 0} friends</p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#0D2B1F] flex items-center gap-2 mb-6">
              <Settings className="text-[#1DB88E]" size={22} /> Account Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-200 border rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" readOnly value={currentUser.email} className="w-full border-gray-200 border rounded-xl px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Goal</label>
                <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full border-gray-200 border rounded-xl px-4 py-2 bg-white">
                  <option value="" disabled>Choose a goal</option>
                  <option value="Retirement Planning">Retirement Planning</option>
                  <option value="Wealth Building">Wealth Building</option>
                  <option value="Tax Saving">Tax Saving</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Child Education">Child Education</option>
                  <option value="Buy a Home">Buy a Home</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Appetite</label>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                    <button key={r} onClick={() => setRisk(r.toLowerCase())} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-all ${risk?.toLowerCase() === r.toLowerCase() ? 'bg-white shadow-sm text-[#1DB88E]' : 'text-gray-500 hover:text-gray-700'}`}>{r}</button>
                  ))}
                </div>
                {!risk && <p className="text-xs text-gray-400 mt-1 italic pl-1">Choose one</p>}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={handleCancel} className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel Changes</button>
              <button disabled={saving} onClick={handleSaveProfile} className="px-6 py-2 rounded-xl bg-[#1DB88E] text-white font-medium hover:bg-[#159a75] hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#0D2B1F] flex items-center gap-2 mb-6">
                  <Bell className="text-[#1DB88E]" size={22} /> Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailLessonReminders', label: 'Email Lesson Reminders', desc: 'Daily nudge to keep your streak alive' },
                    { key: 'marketVolatilityAlerts', label: 'Market Volatility Alerts', desc: 'When Nifty 50 moves more than 2%' },
                    { key: 'communityMentions', label: 'Community Mentions', desc: 'When someone replies to your threads' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                       <div>
                         <p className="font-semibold text-gray-800">{item.label}</p>
                         <p className="text-xs text-gray-500">{item.desc}</p>
                       </div>
                       <button onClick={() => toggleNotification(item.key)} className={`relative flex items-center w-12 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-[#1DB88E]' : 'bg-gray-300'}`}>
                         <span className={`h-4 w-4 bg-white rounded-full transition-transform transform mx-1 ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#0D2B1F] flex items-center gap-2 mb-6">
                  <LinkIcon className="text-[#1DB88E]" size={22} /> Connected Accounts
                </h3>
                
                {userData?.connectedAccounts && userData.connectedAccounts.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {userData.connectedAccounts.map((acc, i) => (
                      <div key={i} className="flex justify-between items-center p-3 border rounded-xl hover:border-[#1DB88E] group transition-colors cursor-default">
                        <div>
                           <div className="flex items-center gap-2">
                             <p className="font-bold text-gray-800">{acc.broker}</p>
                             {acc.status === 'active' ? (
                               <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">ACTIVE CONNECTION</span>
                             ) : (
                               <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold cursor-pointer">RECONNECT</span>
                             )}
                           </div>
                           <p className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-gray-800 transition-colors">
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded mr-1" title="We only read your portfolio. We never place trades.">READ-ONLY DEMO</span>
                              ₹{acc.portfolioValue?.toLocaleString() || '0'}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No brokerage accounts linked yet.</p>
                )}

                <button onClick={() => setShowBrokerModal(true)} className="w-full py-2 border-2 border-dashed border-[#1DB88E]/50 text-[#1DB88E] font-medium rounded-xl hover:bg-[#1DB88E]/5 transition-colors flex items-center justify-center gap-2">
                  <Plus size={18} /> Link New Brokerage
                </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#0D2B1F] flex items-center gap-2 mb-6">
              <Shield className="text-[#1DB88E]" size={22} /> Earned Certificates
            </h3>
            {userData?.certificates && userData.certificates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                 {userData.certificates.map((cert, i) => (
                   <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">🏆</div>
                        <div>
                          <p className="font-bold text-gray-800">{cert.courseName}</p>
                          <p className="text-xs text-gray-500">Level: {cert.level} • Issued: {new Date(cert.issuedAt?.toDate ? cert.issuedAt.toDate() : cert.issuedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-[#EAF0EC] text-[#0D2B1F] rounded-lg font-medium text-sm hover:bg-[#1DB88E] hover:text-white transition-colors border border-[#0D2B1F]/10">View PDF</button>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50 border-gray-200">
                <p className="text-gray-500">Complete your first course to earn a certificate 🎓</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
