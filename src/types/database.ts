// ─── Application-level types (used in components) ────────────────────────────

export type SportType = 'running' | 'cycling' | 'swimming'
export type RaceStatus = 'draft' | 'published' | 'closed'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type Laterality = 'left' | 'right'
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'

export interface Organizer {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  created_at: string
}

export interface Race {
  id: string
  organizer_id: string
  name: string
  date: string
  location: string
  distance: number
  sport_type: SportType
  price: number
  max_participants: number
  has_waves: boolean
  wave_options: string[]
  shirt_sizes: string[]
  status: RaceStatus
  created_at: string
}

export interface Athlete {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string
  nationality: string | null
  gender: Gender | null
  sport_types: SportType[]
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  beneficiary_name: string | null
  beneficiary_relationship: string | null
  laterality: Laterality | null
  height_cm: number | null
  weight_kg: number | null
  team: string | null
  sport_years: Record<string, number> | null
  created_at: string
}

export interface Registration {
  id: string
  race_id: string
  athlete_id: string
  wave: string | null
  shirt_size: string | null
  expected_finish_time: string | null
  payment_status: PaymentStatus
  stripe_payment_intent_id: string | null
  registered_at: string
}

// ─── Supabase Database type (all rows inlined — required for GenericTable extends check) ──

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          organizer_id: string
          name: string
          date: string
          location: string
          sport_type: string
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          date: string
          location: string
          sport_type?: string
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          name?: string
          date?: string
          location?: string
          sport_type?: string
          description?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_organizer_id_fkey'
            columns: ['organizer_id']
            isOneToOne: false
            referencedRelation: 'organizers'
            referencedColumns: ['id']
          },
        ]
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      races: {
        Row: {
          id: string
          organizer_id: string
          event_id: string | null
          name: string
          date: string
          location: string
          distance: number
          sport_type: string
          price: number
          max_participants: number
          has_waves: boolean
          wave_options: string[]
          shirt_sizes: string[]
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          event_id?: string | null
          name: string
          date: string
          location: string
          distance: number
          sport_type: string
          price?: number
          max_participants: number
          has_waves?: boolean
          wave_options?: string[]
          shirt_sizes?: string[]
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          event_id?: string | null
          name?: string
          date?: string
          location?: string
          distance?: number
          sport_type?: string
          price?: number
          max_participants?: number
          has_waves?: boolean
          wave_options?: string[]
          shirt_sizes?: string[]
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'races_organizer_id_fkey'
            columns: ['organizer_id']
            isOneToOne: false
            referencedRelation: 'organizers'
            referencedColumns: ['id']
          },
        ]
      }
      athletes: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          date_of_birth: string
          nationality: string | null
          gender: string | null
          sport_types: string[]
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          beneficiary_name: string | null
          beneficiary_relationship: string | null
          laterality: string | null
          height_cm: number | null
          weight_kg: number | null
          team: string | null
          sport_years: Record<string, number> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          date_of_birth: string
          nationality?: string | null
          gender?: string | null
          sport_types?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          laterality?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          team?: string | null
          sport_years?: Record<string, number> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string
          nationality?: string | null
          gender?: string | null
          sport_types?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          laterality?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          team?: string | null
          sport_years?: Record<string, number> | null
          created_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          id: string
          race_id: string
          athlete_id: string
          wave: string | null
          shirt_size: string | null
          expected_finish_time: string | null
          payment_status: string
          stripe_payment_intent_id: string | null
          registered_at: string
        }
        Insert: {
          id?: string
          race_id: string
          athlete_id: string
          wave?: string | null
          shirt_size?: string | null
          expected_finish_time?: string | null
          payment_status?: string
          stripe_payment_intent_id?: string | null
          registered_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          athlete_id?: string
          wave?: string | null
          shirt_size?: string | null
          expected_finish_time?: string | null
          payment_status?: string
          stripe_payment_intent_id?: string | null
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registrations_race_id_fkey'
            columns: ['race_id']
            isOneToOne: false
            referencedRelation: 'races'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
        ]
      }
      bib_transfers: {
        Row: {
          id: string
          registration_id: string
          race_id: string
          seller_id: string
          buyer_id: string | null
          transfer_type: string
          asking_price: number | null
          message: string | null
          status: string
          created_at: string
          claimed_at: string | null
        }
        Insert: {
          id?: string
          registration_id: string
          race_id: string
          seller_id: string
          buyer_id?: string | null
          transfer_type?: string
          asking_price?: number | null
          message?: string | null
          status?: string
          created_at?: string
          claimed_at?: string | null
        }
        Update: {
          id?: string
          registration_id?: string
          race_id?: string
          seller_id?: string
          buyer_id?: string | null
          transfer_type?: string
          asking_price?: number | null
          message?: string | null
          status?: string
          created_at?: string
          claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bib_transfers_registration_id_fkey'
            columns: ['registration_id']
            isOneToOne: false
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bib_transfers_race_id_fkey'
            columns: ['race_id']
            isOneToOne: false
            referencedRelation: 'races'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bib_transfers_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bib_transfers_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sport_type: 'running' | 'cycling' | 'swimming'
      race_status: 'draft' | 'published' | 'closed'
      payment_status: 'pending' | 'paid' | 'refunded'
      laterality: 'left' | 'right'
      gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
