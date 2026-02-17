import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useUserStore = create((set) => ({
    user: null,
    profile: null,
    loading: true,

    initialize: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
            // Fetch profile
            let { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()

            // If profile doesn't exist, create it (safe fallback)
            if (!profile) {
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert([{
                        id: session.user.id,
                        full_name: session.user.user_metadata?.full_name
                    }])
                    .select()
                    .single();

                if (newProfile) profile = newProfile;
            }

            set({ user: session.user, profile: profile || null, loading: false })
        } else {
            set({ user: null, profile: null, loading: false })
        }

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                let { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (!profile) {
                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .insert([{
                            id: session.user.id,
                            full_name: session.user.user_metadata?.full_name
                        }])
                        .select()
                        .single();
                    if (newProfile) profile = newProfile;
                }
                set({ user: session.user, profile: profile || null, loading: false })
            } else {
                set({ user: null, profile: null, loading: false })
            }
        })
    },

    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    },

    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        })
        if (error) throw error

        // Create profile entry manually if trigger fails or just to be safe
        if (data.user) {
            await supabase.from('profiles').insert([
                { id: data.user.id, full_name: fullName }
            ])
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
    },

    // Helper to check premium status
    isPremiumMember: (profile) => {
        if (!profile) return false;
        if (profile.role === 'admin') return true;
        return !!(profile.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date());
    }
}))

export default useUserStore
