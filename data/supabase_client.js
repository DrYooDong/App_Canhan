// ============================================
// NỘI TÂM — Local Profile Manager (replaces Supabase)
// All data stored locally in localStorage
// ============================================

const PROFILE_STORAGE_KEY = 'noitam_user_profile';

// Legacy SupabaseManager kept for backward compatibility
const SupabaseManager = {
  isConfigured: () => false,

  fetchProfiles: async () => {
    const p = _getLocalProfile();
    if (p && p.name) {
      return [{ id: 'local', name: p.name }];
    }
    return [{ id: 'default', name: 'Hồ Sơ Cá Nhân (Local)' }];
  },

  loadProfile: async (profileId) => {
    // With local storage, data is always available via Onboarding.getProfile()
    // Legacy compatibility: expose default tuvi data
    if (window.DEFAULT_TUVI_DATA) window.TUVI_DATA = window.DEFAULT_TUVI_DATA;
    if (window.DEFAULT_TUVI_PALACES) window.TUVI_PALACES = window.DEFAULT_TUVI_PALACES;
    if (window.DEFAULT_ANNUAL_DYNAMICS) window.ANNUAL_DYNAMICS = window.DEFAULT_ANNUAL_DYNAMICS;
    if (window.DEFAULT_TUVI_SECTIONS) window.TUVI_SECTIONS = window.DEFAULT_TUVI_SECTIONS;
    return true;
  },

  getCurrentProfileId: () => {
    return 'local';
  },

  setCurrentProfileId: (profileId) => {
    // no-op for local mode
  }
};

function _getLocalProfile() {
  try {
    const d = localStorage.getItem(PROFILE_STORAGE_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
}

window.SupabaseManager = SupabaseManager;
