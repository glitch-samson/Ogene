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
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()

            set({ user: session.user, profile: profile || null, loading: false })

            // If profile doesn't exist, create it (safe fallback)
            if (!profile && session.user) {
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert([{
                        id: session.user.id,
                        full_name: session.user.user_metadata?.full_name
                    }])
                    .select()
                    .single();

                if (newProfile) set({ profile: newProfile });
            }
        } else {
            set({ user: null, profile: null, loading: false })
        }

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
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
    }
}))

export default useUserStore
