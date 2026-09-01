const { createClient } = require('@supabase/supabase-js')

const createStorageAdapter = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase Storage not configured')
    return {
      upload: async () => ({ data: null, error: 'Storage not configured' }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      delete: async () => ({ error: 'Storage not configured' }),
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

  const upload = async (file, path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Upload error:', error)
      return { data: null, error: error.message }
    }
  }

  const getPublicUrl = (path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return { data }
  }

  const delete = async (paths) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths)
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Delete error:', error)
      return { error: error.message }
    }
  }

  return { upload, getPublicUrl, delete }
}

module.exports = { createStorageAdapter }
