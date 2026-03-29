import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EncaminhamentosClient from './encaminhamentos-client'
import type { Database } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Encaminhamentos' }

export default async function EncaminhamentosPage() {
  const supabase = await createClient()

  const { data: encaminhamentos } = await supabase
    .from('encaminhamentos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return <EncaminhamentosClient encaminhamentos={encaminhamentos || []} />
}
