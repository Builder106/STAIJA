<template>
  <div class="user-management">
    <div class="header">
      <h1>User Management</h1>
      <p class="subtitle">Manage user roles and permissions</p>
    </div>

    <div class="content">
      <!-- Search and Filter -->
      <div class="filters">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or role..."
            @input="debouncedSearch"
          >
          <span class="search-icon"><Icon icon="lucide:search" /></span>
        </div>

        <div class="filter-tabs">
          <button
            v-for="role in allRoles"
            :key="role"
            @click="activeFilter = role"
            :class="['filter-tab', { active: activeFilter === role }]"
          >
            {{ role.replace('_', ' ').toUpperCase() }}
            <span class="count">{{ getRoleCount(role) }}</span>
          </button>
          <button
            @click="activeFilter = null"
            :class="['filter-tab', { active: activeFilter === null }]"
          >
            ALL
            <span class="count">{{ users.length }}</span>
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="users-table">
        <div class="table-header">
          <div class="col-user">User</div>
          <div class="col-role">Role</div>
          <div class="col-status">Status</div>
          <div class="col-joined">Joined</div>
          <div class="col-actions">Actions</div>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading users...</p>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="no-users">
          <p>No users found matching your criteria.</p>
        </div>

        <div v-else class="table-body">
          <div
            v-for="user in paginatedUsers"
            :key="user.uid"
            class="user-row"
          >
            <div class="col-user">
              <div class="user-info">
                <div class="avatar">
                  {{ getInitials(user.displayName || user.email) }}
                </div>
                <div class="user-details">
                  <div class="name">{{ user.displayName || 'No name' }}</div>
                  <div class="email">{{ user.email }}</div>
                </div>
              </div>
            </div>

            <div class="col-role">
              <div class="role-badge" :class="user.role">
                {{ user.role.replace('_', ' ') }}
              </div>
            </div>

            <div class="col-status">
              <span class="status" :class="getUserStatus(user)">
                {{ getUserStatus(user) }}
              </span>
            </div>

            <div class="col-joined">
              {{ formatDate(user.createdAt) }}
            </div>

            <div class="col-actions">
              <button
                @click="openRoleModal(user)"
                class="btn-change-role"
                :disabled="user.uid === currentUser?.uid"
              >
                Change Role
              </button>
              <button
                @click="viewUserDetails(user)"
                class="btn-view-details"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredUsers.length > itemsPerPage" class="pagination">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="btn-page"
        >
          Previous
        </button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Role Change Modal -->
    <div v-if="showRoleModal" class="modal-overlay" @click="closeRoleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Change User Role</h3>
          <button @click="closeRoleModal" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="user-summary">
            <div class="avatar">{{ getInitials(selectedUser?.displayName || selectedUser?.email) }}</div>
            <div class="user-info">
              <div class="name">{{ selectedUser?.displayName || 'No name' }}</div>
              <div class="email">{{ selectedUser?.email }}</div>
              <div class="current-role">Current role: {{ selectedUser?.role }}</div>
            </div>
          </div>

          <div class="role-selection">
            <label>Select new role:</label>
            <div class="role-options">
              <label v-for="role in assignableRoles" :key="role" class="role-option">
                <input
                  type="radio"
                  :value="role"
                  v-model="newRole"
                  :disabled="!canAssignRole(role)"
                >
                <span class="role-name">{{ role.replace('_', ' ') }}</span>
                <span class="role-description">{{ getRoleDescription(role) }}</span>
                <span v-if="!canAssignRole(role)" class="disabled-reason">
                  (Insufficient permissions)
                </span>
              </label>
            </div>
          </div>

          <div class="reason-field">
            <label for="changeReason">Reason for change:</label>
            <textarea
              id="changeReason"
              v-model="changeReason"
              placeholder="Please provide a reason for this role change..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeRoleModal" class="btn-cancel">Cancel</button>
          <button
            @click="confirmRoleChange"
            :disabled="!newRole || !changeReason.trim() || roleChanging"
            class="btn-confirm"
          >
            <span v-if="roleChanging" class="spinner small"></span>
            {{ roleChanging ? 'Changing...' : 'Change Role' }}
          </button>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserDetails" class="modal-overlay" @click="closeUserDetails">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>User Details & Permissions</h3>
          <button @click="closeUserDetails" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="user-summary">
            <div class="avatar large">{{ getInitials(selectedUser?.displayName || selectedUser?.email) }}</div>
            <div class="user-info">
              <div class="name">{{ selectedUser?.displayName || 'No name' }}</div>
              <div class="email">{{ selectedUser?.email }}</div>
              <div class="current-role">Role: {{ selectedUser?.role }}</div>
              <div class="joined">Joined: {{ formatDate(selectedUser?.createdAt) }}</div>
            </div>
          </div>

          <div class="permissions-section">
            <h4>Permissions</h4>
            <div class="permissions-grid">
              <div
                v-for="permission in allPermissions"
                :key="permission"
                class="permission-item"
                :class="{ granted: hasPermission(permission) }"
              >
                <span class="permission-name">{{ permission.replace('_', ' ') }}</span>
                <span class="permission-status">
                  <Icon v-if="hasPermission(permission)" icon="lucide:check" />
                  <Icon v-else icon="lucide:x" />
                </span>
              </div>
            </div>
          </div>

          <div class="audit-section">
            <h4>Recent Activity</h4>
            <div v-if="userAuditLogs.length === 0" class="no-activity">
              No recent activity found.
            </div>
            <div v-else class="activity-list">
              <div
                v-for="log in userAuditLogs"
                :key="log.id"
                class="activity-item"
              >
                <div class="activity-icon"><Icon :icon="getActivityIcon(log.type)" /></div>
                <div class="activity-content">
                  <div class="activity-text">{{ getActivityText(log) }}</div>
                  <div class="activity-time">{{ formatDate(log.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeUserDetails" class="btn-close-modal">Close</button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message-toast" :class="message.type">
      <span class="message-icon"><Icon :icon="message.type === 'success' ? 'lucide:check' : 'lucide:alert-triangle'" /></span>
      <span class="message-text">{{ message.text }}</span>
      <button @click="message = null" class="message-close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { AuthService, DatabaseService, PermissionService, AuditService, ALL_ROLES, ALL_PERMISSIONS, type UserProfile, type UserRole, type Permission, type AuditLog } from '../../services/firebase'
import { auth } from '../../config/firebase'

// Reactive data
const users = ref<UserProfile[]>([])
const loading = ref(true)
const searchQuery = ref('')
const activeFilter = ref<UserRole | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showRoleModal = ref(false)
const showUserDetails = ref(false)
const selectedUser = ref<UserProfile | null>(null)
const newRole = ref<UserRole | null>(null)
const changeReason = ref('')
const roleChanging = ref(false)
const currentUser = ref<any>(null)
const userAuditLogs = ref<AuditLog[]>([])
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

// Driven from src/services/permissions.ts so new roles or permissions show
// up in admin UIs automatically. Don't reintroduce hardcoded copies here —
// they drift the moment someone adds a permission elsewhere.
const allRoles: UserRole[] = ALL_ROLES
const allPermissions: Permission[] = ALL_PERMISSIONS

const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by role
  if (activeFilter.value) {
    filtered = filtered.filter(user => user.role === activeFilter.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      (user.displayName?.toLowerCase().includes(query)) ||
      (user.email?.toLowerCase().includes(query)) ||
      (user.role?.toLowerCase().includes(query))
    )
  }

  return filtered
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
})

const assignableRoles = computed(() => {
  return allRoles.filter(role => PermissionService.canAssignRole(currentUser.value?.role || 'applicant', role))
})

// Methods
const loadUsers = async () => {
  try {
    loading.value = true
    users.value = await DatabaseService.getAllUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
    showMessage('error', 'Failed to load users')
  } finally {
    loading.value = false
  }
}

const getRoleCount = (role: UserRole) => {
  return users.value.filter(user => user.role === role).length
}

const getInitials = (name: string | undefined) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getUserStatus = (_user: UserProfile) => {
  // In a real app, you would check last login, etc.
  return 'active'
}

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const openRoleModal = (user: UserProfile) => {
  selectedUser.value = user
  newRole.value = user.role
  changeReason.value = ''
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedUser.value = null
  newRole.value = null
  changeReason.value = ''
}

const viewUserDetails = async (user: UserProfile) => {
  selectedUser.value = user
  showUserDetails.value = true

  // Load audit logs for this user
  try {
    userAuditLogs.value = await AuditService.getAuditLogs(user.uid, 10)
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    userAuditLogs.value = []
  }
}

const closeUserDetails = () => {
  showUserDetails.value = false
  selectedUser.value = null
  userAuditLogs.value = []
}

const confirmRoleChange = async () => {
  if (!selectedUser.value || !newRole.value || !changeReason.value.trim()) return

  try {
    roleChanging.value = true

    await AuthService.assignRole(
      selectedUser.value.uid,
      newRole.value,
      changeReason.value
    )

    // Update local user data
    const userIndex = users.value.findIndex(u => u.uid === selectedUser.value?.uid)
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole.value
      users.value[userIndex].updatedAt = new Date()
    }

    showMessage('success', `Role changed to ${newRole.value}`)
    closeRoleModal()
  } catch (error: any) {
    console.error('Failed to change role:', error)
    showMessage('error', error.message || 'Failed to change role')
  } finally {
    roleChanging.value = false
  }
}

const canAssignRole = (role: UserRole) => {
  return PermissionService.canAssignRole(currentUser.value?.role || 'applicant', role)
}

const hasPermission = (permission: Permission) => {
  return selectedUser.value ? PermissionService.hasPermission(selectedUser.value.role, permission) : false
}

const getRoleDescription = (role: UserRole) => {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full system access and user management',
    staff: 'Administrative access and application management',
    alumni: 'Access to alumni portal and networking',
    student: 'Active program participation and learning access',
    applicant: 'Program application and basic access',
    mentor: 'Reviews assigned students and submits feedback',
  }
  return descriptions[role] || ''
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'role_change': return 'lucide:refresh-cw'
    case 'permission_check': return 'lucide:lock'
    default: return 'lucide:file-edit'
  }
}

const getActivityText = (log: AuditLog) => {
  switch (log.type) {
    case 'role_change':
      return `Role changed from ${log.previousRole} to ${log.newRole}`
    case 'permission_check':
      return `${log.granted ? 'Granted' : 'Denied'} access to ${log.permission}`
    default:
      return 'Activity logged'
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => message.value = null, 5000)
}

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page on search
  }, 300)
}

// Watch for filter changes
watch([activeFilter, searchQuery], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  currentUser.value = auth.currentUser
  await loadUsers()
})
</script>

<style scoped>
.user-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
}

.filters {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-tab:hover {
  border-color: #007bff;
}

.filter-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

.users-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 2fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.user-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 2fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.user-row:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-details .name {
  font-weight: 600;
  color: #2c3e50;
}

.user-details .email {
  color: #6c757d;
  font-size: 0.875rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}

.role-badge.admin {
  background: #dc3545;
  color: white;
}

.role-badge.staff {
  background: #28a745;
  color: white;
}

.role-badge.mentor {
  background: #17a2b8;
  color: white;
}

.role-badge.alumni {
  background: #ffc107;
  color: black;
}

.role-badge.applicant {
  background: #6c757d;
  color: white;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.btn-change-role, .btn-view-details {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
}

.btn-change-role {
  background: #007bff;
  color: white;
}

.btn-change-role:hover:not(:disabled) {
  background: #0056b3;
}

.btn-change-role:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-view-details {
  background: #6c757d;
  color: white;
}

.btn-view-details:hover {
  background: #545b62;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  border-color: #007bff;
  background: #f8f9fa;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6c757d;
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.avatar.large {
  width: 60px;
  height: 60px;
  font-size: 1.2rem;
}

.user-info .name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.user-info .email {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.current-role, .joined {
  font-size: 0.875rem;
  color: #6c757d;
}

.role-selection {
  margin-bottom: 1.5rem;
}

.role-selection label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.role-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option:hover:not(.disabled) {
  border-color: #007bff;
  background: #f8f9fa;
}

.role-option.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.role-option input[type="radio"] {
  margin-top: 0.125rem;
}

.role-name {
  font-weight: 600;
  color: #2c3e50;
  text-transform: capitalize;
}

.role-description {
  color: #6c757d;
  font-size: 0.875rem;
  flex: 1;
}

.disabled-reason {
  color: #dc3545;
  font-size: 0.875rem;
  font-style: italic;
}

.reason-field {
  margin-bottom: 1.5rem;
}

.reason-field label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.reason-field textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-cancel, .btn-confirm, .btn-close-modal {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #545b62;
}

.btn-confirm {
  background: #007bff;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #0056b3;
}

.btn-confirm:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-close-modal {
  background: #6c757d;
  color: white;
}

.permissions-section h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.permission-item.granted {
  background: #d4edda;
  border-color: #c3e6cb;
}

.permission-name {
  font-size: 0.875rem;
  color: #495057;
}

.permission-status {
  font-weight: 600;
}

.audit-section h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.2rem;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #6c757d;
  font-size: 0.875rem;
}

.no-activity {
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  font-style: italic;
}

.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1001;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.message-toast.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message-toast.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message-icon {
  font-size: 1.2rem;
  font-weight: 600;
}

.message-text {
  flex: 1;
}

.message-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.7;
}

.message-close:hover {
  opacity: 1;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-users {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

/* Responsive */
@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }

  .user-row, .table-header {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .filter-tabs {
    justify-content: center;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .permissions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
