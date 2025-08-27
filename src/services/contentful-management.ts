// Direct Contentful Management API service
import { createClient } from 'contentful-management'
import { getAppConfig } from '../utils/env'

// Types
export interface BlogPostData {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  featuredImage?: string
}

export interface AuthorData {
  name: string
  slug: string
  bio?: string
  profilePicture?: string
}

export interface CategoryData {
  name: string
  slug: string
  description?: string
}

export interface ProgramData {
  title: string
  slug: string
  summary?: string
  content?: string
  heroImage?: string
  status: 'draft' | 'published'
}

export interface EventData {
  title: string
  slug: string
  description?: string
  startsAt: string
  endsAt?: string
  location?: string
  coverImage?: string
  registrationUrl?: string
  status: 'draft' | 'published' | 'cancelled'
}

export interface AlumniStoryData {
  title: string
  slug: string
  excerpt?: string
  content?: string
  alumnusName?: string
  cohort?: string
  profileImage?: string
  status: 'draft' | 'published'
  publishDate?: string
}

// Contentful Management API client
class ContentfulManagementService {
  private client: any
  private spaceId: string
  private environmentId: string

  constructor() {
    const config = getAppConfig()
    if (!config.contentful) {
      throw new Error('Contentful configuration not found')
    }

    // Note: You'll need to add VITE_CONTENTFUL_MANAGEMENT_TOKEN to your .env file
    const managementToken = import.meta.env.VITE_CONTENTFUL_MANAGEMENT_TOKEN
    if (!managementToken) {
      throw new Error('Contentful Management API token not found. Add VITE_CONTENTFUL_MANAGEMENT_TOKEN to your .env file')
    }

    this.client = createClient({
      accessToken: managementToken
    })
    this.spaceId = config.contentful.spaceId
    this.environmentId = config.contentful.environmentId
  }

  private async getEnvironment() {
    const space = await this.client.getSpace(this.spaceId)
    return await space.getEnvironment(this.environmentId)
  }

  // Blog Post Management
  async createBlogPost(data: BlogPostData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('blogPost', {
        fields: {
          title: {
            'en-US': data.title
          },
          slug: {
            'en-US': data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          },
          content: {
            'en-US': {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: data.content,
                      marks: [],
                      data: {}
                    }
                  ]
                }
              ]
            }
          },
          excerpt: {
            'en-US': data.excerpt || data.content.substring(0, 150) + '...'
          },
          publishDate: {
            'en-US': new Date().toISOString()
          },
          status: {
            'en-US': 'draft'
          },
          tags: {
            'en-US': data.tags || []
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Blog post created successfully'
      }
    } catch (error: any) {
      console.error('Error creating blog post:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create blog post'
      }
    }
  }

  // Author Management
  async createAuthor(data: AuthorData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('author', {
        fields: {
          name: {
            'en-US': data.name
          },
          slug: {
            'en-US': data.slug
          },
          bio: {
            'en-US': data.bio || ''
          },
          profilePicture: {
            'en-US': data.profilePicture || ''
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Author created successfully'
      }
    } catch (error: any) {
      console.error('Error creating author:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create author'
      }
    }
  }

  // Category Management
  async createCategory(data: CategoryData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('category', {
        fields: {
          name: {
            'en-US': data.name
          },
          slug: {
            'en-US': data.slug
          },
          description: {
            'en-US': data.description || ''
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Category created successfully'
      }
    } catch (error: any) {
      console.error('Error creating category:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create category'
      }
    }
  }

  // Program Management
  async createProgram(data: ProgramData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('program', {
        fields: {
          title: {
            'en-US': data.title
          },
          slug: {
            'en-US': data.slug
          },
          summary: {
            'en-US': data.summary || ''
          },
          content: {
            'en-US': data.content || ''
          },
          heroImage: {
            'en-US': data.heroImage || ''
          },
          status: {
            'en-US': data.status
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Program created successfully'
      }
    } catch (error: any) {
      console.error('Error creating program:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create program'
      }
    }
  }

  // Event Management
  async createEvent(data: EventData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('event', {
        fields: {
          title: {
            'en-US': data.title
          },
          slug: {
            'en-US': data.slug
          },
          description: {
            'en-US': data.description || ''
          },
          startsAt: {
            'en-US': data.startsAt
          },
          endsAt: {
            'en-US': data.endsAt || ''
          },
          location: {
            'en-US': data.location || ''
          },
          coverImage: {
            'en-US': data.coverImage || ''
          },
          registrationUrl: {
            'en-US': data.registrationUrl || ''
          },
          status: {
            'en-US': data.status
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Event created successfully'
      }
    } catch (error: any) {
      console.error('Error creating event:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create event'
      }
    }
  }

  // Alumni Story Management
  async createAlumniStory(data: AlumniStoryData): Promise<{ success: boolean; entryId: string; message: string }> {
    try {
      const environment = await this.getEnvironment()
      
      const entry = await environment.createEntry('alumniStory', {
        fields: {
          title: {
            'en-US': data.title
          },
          slug: {
            'en-US': data.slug
          },
          excerpt: {
            'en-US': data.excerpt || ''
          },
          content: {
            'en-US': data.content || ''
          },
          alumnusName: {
            'en-US': data.alumnusName || ''
          },
          cohort: {
            'en-US': data.cohort || ''
          },
          profileImage: {
            'en-US': data.profileImage || ''
          },
          status: {
            'en-US': data.status
          },
          publishDate: {
            'en-US': data.publishDate || new Date().toISOString()
          }
        }
      })

      await entry.publish()

      return {
        success: true,
        entryId: entry.sys.id,
        message: 'Alumni story created successfully'
      }
    } catch (error: any) {
      console.error('Error creating alumni story:', error)
      return {
        success: false,
        entryId: '',
        message: error.message || 'Failed to create alumni story'
      }
    }
  }

  // Get all entries of a specific content type
  async getEntries(contentType: string, limit = 100): Promise<any[]> {
    try {
      const environment = await this.getEnvironment()
      const entries = await environment.getEntries({
        content_type: contentType,
        limit
      })
      return entries.items
    } catch (error: any) {
      console.error(`Error fetching ${contentType} entries:`, error)
      return []
    }
  }
}

// Export singleton instance
export const contentfulManagement = new ContentfulManagementService()
