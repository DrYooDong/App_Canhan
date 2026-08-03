// ============================================
// NỘI TÂM — Supabase Client cho Lá Số Tử Vi
// ============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabase = null;

if (window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
  // We use supabase-js library via CDN which exposes 'supabase' on window
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const SupabaseManager = {
  isConfigured: () => {
    return supabase !== null;
  },

  fetchProfiles: async () => {
    if (!SupabaseManager.isConfigured()) {
      return [{ id: 'default', name: 'Mặc định (Local)' }];
    }

    try {
      const { data, error } = await supabase
        .from('astrology_profiles')
        .select('id, name, gender, dob');
      
      if (error) throw error;
      
      return data && data.length > 0 ? data : [{ id: 'default', name: 'Mặc định (Local)' }];
    } catch (e) {
      console.error("Error fetching profiles:", e);
      return [{ id: 'default', name: 'Mặc định (Local)' }];
    }
  },

  loadProfile: async (profileId) => {
    if (!SupabaseManager.isConfigured() || profileId === 'default') {
      // Fallback to the hardcoded default data (already loaded from tuvi.js)
      // We assume window.DEFAULT_TUVI_DATA etc are available or we just don't overwrite if it's already there.
      if (window.DEFAULT_TUVI_DATA) window.TUVI_DATA = window.DEFAULT_TUVI_DATA;
      if (window.DEFAULT_TUVI_PALACES) window.TUVI_PALACES = window.DEFAULT_TUVI_PALACES;
      if (window.DEFAULT_ANNUAL_DYNAMICS) window.ANNUAL_DYNAMICS = window.DEFAULT_ANNUAL_DYNAMICS;
      if (window.DEFAULT_TUVI_SECTIONS) window.TUVI_SECTIONS = window.DEFAULT_TUVI_SECTIONS;
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('astrology_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) throw error;

      if (data) {
        if (data.tuvi_data) window.TUVI_DATA = data.tuvi_data;
        if (data.tuvi_palaces) window.TUVI_PALACES = data.tuvi_palaces;
        if (data.annual_dynamics) window.ANNUAL_DYNAMICS = data.annual_dynamics;
        if (data.tuvi_sections) window.TUVI_SECTIONS = data.tuvi_sections;
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error loading profile:", e);
      return false;
    }
  },

  getCurrentProfileId: () => {
    return localStorage.getItem('active_astrology_profile_id') || 'default';
  },

  setCurrentProfileId: (profileId) => {
    localStorage.setItem('active_astrology_profile_id', profileId);
  }
};

window.SupabaseManager = SupabaseManager;
