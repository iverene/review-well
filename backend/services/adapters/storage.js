import { createClient } from '@supabase/supabase-js'

const createStorageAdapter = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase Storage not configured')
    return {
      upload: async () => ({ data: null, error: 'Storage not configured' }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      getSignedUrl: async () => ({ data: null, error: 'Storage not configured' }),
      delete: async () => ({ error: 'Storage not configured' }),
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

  const upload = async (file, path, contentType) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...(contentType && { contentType }),
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

  const deleteFiles = async (paths) => {
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

  // Short-lived signed URL for unlisted/private source files (60s default).
  const getSignedUrl = async (path, expiresIn = 60) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Signed URL error:', error)
      return { data: null, error: error.message }
    }
  }

  return { upload, getPublicUrl, getSignedUrl, delete: deleteFiles }
}

export { createStorageAdapter }
