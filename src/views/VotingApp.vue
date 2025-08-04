<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="voting-app">
    <!-- Notification Center -->
    <NotificationCenter />
    <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="#">
          <strong class="has-text-white">Ứng Dụng Bỏ Phiếu</strong>
        </a>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div v-if="!isConnected" class="buttons">
            <button class="button is-light" @click="connect" :disabled="isLoading">
              <span v-if="isLoading" class="icon is-small mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              {{ isLoading ? 'Đang kết nối...' : 'Kết nối MetaMask' }}
            </button>
          </div>
          <div v-else class="buttons">
            <span class="has-text-white mr-3">
              {{ shortAddress }}
              <span v-if="isCurrentUserAdmin" class="icon is-small ml-1" title="Admin">
                <i class="fas fa-crown has-text-warning"></i>
              </span>
            </span>
            <button class="button is-danger is-small" @click="disconnect">Ngắt kết nối</button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <!-- Connection Status -->
      <div v-if="!isConnected" class="notification is-info">
        <p>Vui lòng kết nối ví MetaMask của bạn để tương tác với Contract bỏ phiếu.</p>
      </div>

      <!-- Contract Information -->
      <div v-if="isConnected" class="columns">
        <div class="column is-8">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">Thông Tin Contract</p>
            </header>
            <div class="card-content">
              <div class="content">
                <p>
                  <strong>Tên Cuộc Bầu Cử:</strong> {{ contractInfo.electionName || 'Đang tải...' }}
                </p>
                <p>
                  <strong>Trạng Thái:</strong>
                  <span
                    :class="{
                      'has-text-warning': electionStatus === 'not_started',
                      'has-text-success': electionStatus === 'active',
                      'has-text-danger': electionStatus === 'ended',
                    }"
                  >
                    {{
                      electionStatus === 'not_started'
                        ? ' Chưa bắt đầu'
                        : electionStatus === 'active'
                          ? ' Đang diễn ra'
                          : ' Đã kết thúc'
                    }}
                  </span>
                </p>
                <p><strong>Thời Gian Bắt Đầu:</strong> {{ formatTime(contractInfo.startTime) }}</p>
                <p><strong>Thời Gian Kết Thúc:</strong> {{ formatTime(contractInfo.endTime) }}</p>
                <p><strong>Tổng Số Phiếu:</strong> {{ contractInfo.totalVotes || 0 }}</p>
                <p>
                  <strong>Số Phiếu Tối Đa Mỗi Cử Tri:</strong>
                  {{ contractInfo.maxVotesPerVoter || 0 }}
                </p>
                <p><strong>Được Ủy Quyền:</strong> {{ voterInfo.authorized ? 'Có' : 'Không' }}</p>
                <p><strong>Số Phiếu Đã Bỏ:</strong> {{ voterInfo.votesCast || 0 }}</p>
                <p v-if="contractInfo.started && voterInfo.authorized">
                  <strong>Phiếu Còn Lại:</strong> {{ remainingVotes }}
                </p>
              </div>
            </div>
          </div>

          <!-- Candidates Section -->
          <div class="card mt-4">
            <header class="card-header">
              <p class="card-header-title">Ứng Viên</p>
              <button
                class="button is-primary is-small mr-3 mt-3"
                @click="loadCandidates"
                :disabled="isLoading"
              >
                Làm mới
              </button>
            </header>
            <div class="card-content">
              <div v-if="candidates.length === 0" class="content">
                <p>Không tìm thấy ứng viên nào. Hãy thêm một số ứng viên để bắt đầu.</p>
              </div>
              <div v-else class="content">
                <!-- Checkbox voting interface when election is active and user is authorized -->
                <div v-if="electionStatus === 'active' && voterInfo.authorized">
                  <div class="notification is-info is-light mb-4">
                    <p><strong>Hướng dẫn bỏ phiếu:</strong></p>
                    <p>
                      Chọn tối đa {{ remainingVotes }} ứng viên và nhấn "Gửi phiếu bầu" để hoàn tất.
                    </p>
                  </div>

                  <div v-for="candidate in candidates" :key="candidate.id" class="box">
                    <div class="columns is-vcentered">
                      <div class="column is-narrow">
                        <label class="checkbox">
                          <input
                            type="checkbox"
                            :checked="selectedCandidates.has(candidate.id)"
                            :disabled="
                              (!selectedCandidates.has(candidate.id) && !canSelectMore) ||
                              userVotes.has(candidate.id)
                            "
                            @change="toggleCandidateSelection(candidate.id)"
                          />
                        </label>
                      </div>
                      <div class="column">
                        <p><strong>ID:</strong> {{ candidate.id }}</p>
                        <p><strong>Tên:</strong> {{ candidate.name }}</p>
                        <p v-if="isCurrentUserAdmin">
                          <strong>Số phiếu:</strong>
                          {{ candidate.voteCount }}
                        </p>
                        <p v-if="userVotes.has(candidate.id)" class="has-text-success">
                          <span class="icon is-small">
                            <i class="fas fa-check"></i>
                          </span>
                          Đã bỏ phiếu
                        </p>
                      </div>
                      <!-- <div class="column is-narrow">
                        <button
                          class="button is-warning is-small"
                          @click="revokeVote(candidate.id)"
                          :disabled="!userVotes.has(candidate.id) || isLoading"
                          v-if="userVotes.has(candidate.id)"
                        >
                          <span v-if="isLoading" class="icon is-small mr-1">
                            <i class="fas fa-spinner fa-spin"></i>
                          </span>
                          Hủy phiếu
                        </button>
                      </div> -->
                    </div>
                  </div>

                  <div class="field mt-4" v-if="selectedCandidates.size > 0">
                    <button
                      class="button is-primary is-normal"
                      @click="voteMultiple"
                      :disabled="isLoading || selectedCandidates.size === 0"
                    >
                      <span v-if="isLoading" class="icon is-small mr-1">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      Gửi phiếu bầu ({{ selectedCandidates.size }} ứng viên)
                    </button>
                  </div>
                </div>

                <!-- Individual voting interface when election is active but user not authorized OR wants individual voting -->
                <div v-else-if="electionStatus === 'active' && !voterInfo.authorized">
                  <div class="notification is-warning is-light mb-4">
                    <p><strong>Không có quyền bỏ phiếu:</strong></p>
                    <p>Bạn chưa được ủy quyền để tham gia bỏ phiếu trong cuộc bầu cử này.</p>
                  </div>

                  <div v-for="candidate in candidates" :key="candidate.id" class="box">
                    <div class="columns is-vcentered">
                      <div class="column">
                        <p><strong>ID:</strong> {{ candidate.id }}</p>
                        <p><strong>Tên:</strong> {{ candidate.name }}</p>
                        <p v-if="isCurrentUserAdmin">
                          <strong>Số phiếu:</strong>
                          {{ candidate.voteCount }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Display-only interface when election is not active -->
                <div v-else>
                  <div v-for="candidate in candidates" :key="candidate.id" class="box">
                    <div class="columns is-vcentered">
                      <div class="column">
                        <p><strong>ID:</strong> {{ candidate.id }}</p>
                        <p><strong>Tên:</strong> {{ candidate.name }}</p>
                        <p><strong>Số phiếu:</strong> {{ candidate.voteCount }}</p>
                        <p v-if="userVotes.has(candidate.id)" class="has-text-success">
                          <span class="icon is-small">
                            <i class="fas fa-check"></i>
                          </span>
                          Đã bỏ phiếu
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Winner Section -->
          <div class="card mt-4">
            <header class="card-header">
              <p class="card-header-title">Người Thắng Cuộc</p>
              <button
                class="button is-info is-small mr-3 mt-3"
                @click="getWinner"
                :disabled="isLoading"
              >
                Lấy Kết Quả
              </button>
            </header>
            <div class="card-content">
              <div v-if="winner" class="content">
                <p><strong>ID Người Thắng:</strong> {{ winner.winnerId }}</p>
                <p><strong>Tên Người Thắng:</strong> {{ winner.winnerName }}</p>
                <p><strong>Số Phiếu Thắng:</strong> {{ winner.winnerVotes }}</p>
              </div>
              <div v-else class="content">
                <p>Chưa xác định người thắng hoặc cuộc bầu cử vẫn đang diễn ra.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Functions -->
        <div v-if="isCurrentUserAdmin" class="column is-4">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">
                <span class="icon is-small mr-2">
                  <i class="fas fa-crown"></i>
                </span>
                Chức Năng Quản Trị
              </p>
            </header>
            <div class="card-content">
              <div class="content">
                <!-- Election Management - Only show when election hasn't started -->
                <div v-if="electionStatus === 'not_started'">
                  <!-- Start Election -->
                  <div class="field">
                    <button
                      class="button is-success is-fullwidth"
                      @click="startElection"
                      :disabled="isLoading || candidates.length === 0"
                    >
                      <span v-if="isLoading" class="icon is-small mr-1">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      <span class="icon is-small mr-1">
                        <i class="fas fa-play"></i>
                      </span>
                      Bắt Đầu Bầu Cử
                    </button>
                    <p class="help" v-if="candidates.length === 0">
                      Cần có ít nhất 1 ứng viên để bắt đầu bầu cử
                    </p>
                  </div>

                  <hr />

                  <!-- Add Single Candidate -->
                  <div class="field">
                    <label class="label">Thêm Ứng Viên</label>
                    <div class="control">
                      <input
                        class="input"
                        v-model="newCandidateName"
                        placeholder="Tên ứng viên"
                        @keyup.enter="handleAddCandidate"
                        :disabled="isLoading"
                      />
                    </div>
                    <button
                      class="button is-primary mt-2"
                      @click="handleAddCandidate"
                      :disabled="!newCandidateName.trim() || isLoading"
                    >
                      <span v-if="isLoading" class="icon is-small mr-1">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      Thêm Ứng Viên
                    </button>
                  </div>

                  <!-- Add Multiple Candidates -->
                  <div class="field">
                    <label class="label">Thêm Nhiều Ứng Viên</label>
                    <div class="control">
                      <textarea
                        class="textarea"
                        v-model="multipleCandidateNames"
                        placeholder="Nhập tên các ứng viên, mỗi tên trên một dòng"
                        rows="4"
                        :disabled="isLoading"
                      ></textarea>
                    </div>
                    <button
                      class="button is-primary mt-2"
                      @click="handleAddMultipleCandidates"
                      :disabled="!multipleCandidateNames.trim() || isLoading"
                    >
                      <span v-if="isLoading" class="icon is-small mr-1">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      Thêm Tất Cả Ứng Viên
                    </button>
                  </div>

                  <!-- Remove Candidate -->
                  <div class="field" v-if="candidates.length > 0">
                    <label class="label">Xóa Ứng Viên</label>
                    <div class="control">
                      <div class="select is-fullwidth">
                        <select v-model="selectedCandidateToRemove" :disabled="isLoading">
                          <option value="">Chọn ứng viên để xóa</option>
                          <option
                            v-for="candidate in candidates"
                            :key="candidate.id"
                            :value="candidate.id"
                          >
                            {{ candidate.name }} (ID: {{ candidate.id }})
                          </option>
                        </select>
                      </div>
                    </div>
                    <button
                      class="button is-danger mt-2"
                      @click="handleRemoveCandidate"
                      :disabled="!selectedCandidateToRemove || isLoading"
                    >
                      <span v-if="isLoading" class="icon is-small mr-1">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      Xóa Ứng Viên
                    </button>
                  </div>

                  <hr />
                </div>

                <!-- Authorize Voter - Always available for admin -->
                <div class="field">
                  <label class="label">Ủy Quyền Cử Tri</label>
                  <div class="control">
                    <input
                      class="input"
                      v-model="voterAddress"
                      placeholder="Địa chỉ cử tri"
                      @keyup.enter="handleAuthorizeVoter"
                      :disabled="isLoading"
                    />
                  </div>
                  <button
                    class="button is-info mt-2"
                    @click="handleAuthorizeVoter"
                    :disabled="!voterAddress.trim() || isLoading"
                  >
                    <span v-if="isLoading" class="icon is-small mr-1">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    Ủy Quyền
                  </button>
                </div>

                <hr />

                <!-- Election Control - Only show when election is active -->
                <div v-if="electionStatus === 'active'">
                  <button
                    class="button is-danger is-fullwidth"
                    @click="endElection"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="icon is-small mr-1">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span class="icon is-small mr-1">
                      <i class="fas fa-stop"></i>
                    </span>
                    Kết Thúc Bầu Cử
                  </button>
                  <hr />
                </div>

                <!-- Restart Election - Only show when election is ended -->
                <div v-if="electionStatus === 'ended'">
                  <button
                    class="button is-warning is-fullwidth"
                    @click="restartElection"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="icon is-small mr-1">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span class="icon is-small mr-1">
                      <i class="fas fa-redo"></i>
                    </span>
                    Khởi Động Lại Bầu Cử
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Non-Admin Message -->
        <div v-else-if="isConnected" class="column is-4">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">
                <span class="icon is-small mr-2">
                  <i class="fas fa-user"></i>
                </span>
                Chức Năng Cử Tri
              </p>
            </header>
            <div class="card-content">
              <div class="content">
                <div class="notification is-info is-light">
                  <p><strong>Tài Khoản Cử Tri</strong></p>
                  <p>
                    Bạn đã kết nối với tư cách cử tri. Chỉ quản trị viên Contract mới có thể thực
                    hiện các chức năng quản trị.
                  </p>
                  <p class="is-size-7 mt-2">
                    <strong>Địa Chỉ Quản Trị:</strong>
                    {{
                      adminAddress
                        ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}`
                        : 'Đang tải...'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../assets/style.css'
import { ref, onMounted } from 'vue'
import { useVoting } from '../composables/useVoting'
import NotificationCenter from '../components/NotificationCenter.vue'

const {
  // State
  isConnected,
  contractInfo,
  voterInfo,
  candidates,
  winner,
  isLoading,
  adminAddress,
  selectedCandidates,
  userVotes,

  // Computed
  shortAddress,
  isCurrentUserAdmin,
  electionStatus,
  remainingVotes,
  canSelectMore,

  // Methods
  connect,
  disconnect,
  loadCandidates,
  // revokeVote,
  getWinner,
  addCandidate,
  authorizeVoter,
  endElection,
  restartElection,
  formatTime,
  setupListeners,
  // New methods
  startElection,
  addMultipleCandidates,
  removeCandidate,
  voteMultiple,
  toggleCandidateSelection,
} = useVoting()

// Local reactive state for form inputs
const newCandidateName = ref('')
const voterAddress = ref('')
const multipleCandidateNames = ref('')
const selectedCandidateToRemove = ref('')

// Wrapper functions for form handling
const handleAddCandidate = async () => {
  if (newCandidateName.value.trim()) {
    await addCandidate(newCandidateName.value.trim())
    newCandidateName.value = ''
  }
}

const handleAuthorizeVoter = async () => {
  if (voterAddress.value.trim()) {
    await authorizeVoter(voterAddress.value.trim())
    voterAddress.value = ''
  }
}

const handleAddMultipleCandidates = async () => {
  if (multipleCandidateNames.value.trim()) {
    const names = multipleCandidateNames.value
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (names.length > 0) {
      await addMultipleCandidates(names)
      multipleCandidateNames.value = ''
    }
  }
}

const handleRemoveCandidate = async () => {
  if (selectedCandidateToRemove.value) {
    await removeCandidate(Number(selectedCandidateToRemove.value))
    selectedCandidateToRemove.value = ''
  }
}

// Setup listeners on mount
onMounted(() => {
  setupListeners()
})
</script>

<style scoped>
.voting-app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
