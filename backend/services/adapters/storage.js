import { createClient } from '@supabase/supabase-js'

const createStorageAdapter = (bucketName) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase Storage not configured')
    return {
      upload: async () => ({ data: null, error: 'Storage not configured' }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      getSignedUrl: async () => ({ data: null, error: 'Storage not configured' }),
      download: async () => ({ data: null, error: 'Storage not configured' }),
      delete: async () => ({ error: 'Storage not configured' }),
      removePrefix: async () => ({ error: 'Storage not configured' }),
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  // One adapter serves every caller, but buckets differ by purpose: the
  // default bucket holds private reviewer files, while callers needing
  // public URLs (avatars) pass their own public bucket explicitly.
  const bucket = bucketName || process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

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

  // Remove every object under a prefix (e.g. all versioned source files
  // `{userId}/{reviewerId}/v*` when a reviewer is deleted). Lists in pages
  // of 1000 and removes the collected paths in one call.
  const removePrefix = async (prefix) => {
    try {
      const paths = []
      const limit = 1000
      let offset = 0
      for (;;) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list(prefix, { limit, offset })
        if (error) throw error
        if (!data || data.length === 0) break
        for (const entry of data) {
          paths.push(`${prefix}/${entry.name}`)
        }
        if (data.length < limit) break
        offset += data.length
      }
      if (paths.length === 0) return { error: null, removed: 0 }
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths)
      if (error) throw error
      return { error: null, removed: paths.length }
    } catch (error) {
      console.error('Delete prefix error:', error)
      return { error: error.message }
    }
  }

  // Download a stored object's bytes (Blob) for server-side streaming
  // (e.g. attachment downloads that must honor reviewer visibility).
  const download = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Download error:', error)
      return { data: null, error: error.message }
    }
  }

  return { upload, getPublicUrl, getSignedUrl, download, delete: deleteFiles, removePrefix }
}

export { createStorageAdapter }
