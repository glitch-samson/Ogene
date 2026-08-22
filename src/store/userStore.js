import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        console.error('Failed to load profile:', error)
        return null
    }

    // Profiles are provisioned by the on_auth_user_created database trigger in
    // supabase_setup.sql, not by this client. A missing row means that trigger
    // has not been installed on this project.
    if (!data) {
        console.warn(
            `No profile row for user ${userId}. Run supabase_setup.sql — the ` +
            `on_auth_user_created trigger provisions profiles.`
        )
    }

    return data ?? null
}

const applySession = async (session) => {
    if (!session?.user) {
        useUserStore.setState({ user: null, profile: null, loading: false })
        return
    }

    const profile = await fetchProfile(session.user.id)
    useUserStore.setState({ user: session.user, profile, loading: false })
}

const useUserStore = create((set) => ({
    user: null,
    profile: null,
    loading: true,

    initialize: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()
        await applySession(session)
    },

    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    },

    signUp: async (email, password, fullName) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        })
        if (error) throw error
        // No profile insert here. The database trigger creates it, which also
        // means it cannot be handed a client-supplied `role`.
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
    },
}))

// Registered once, at module scope. Previously this lived inside initialize(),
// which is called from App's effect and was re-invoked after payments — so every
// call stacked another listener, and each one refetched the profile on any auth
// event. INITIAL_SESSION is skipped because initialize() already loads it.
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') return
    applySession(session)
})

export default useUserStore
