<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="voting-app">
    <!-- Notification Center -->
    <NotificationCenter />
    <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="#">
          <strong class="has-text-white">Voting App</strong>
        </a>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div v-if="!isConnected" class="buttons">
            <button class="button is-light" @click="connect" :disabled="isLoading">
              <span v-if="isLoading" class="icon is-small mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              {{ isLoading ? 'Connecting...' : 'Connect MetaMask' }}
            </button>
          </div>
          <div v-else class="buttons">
            <span class="has-text-white mr-3">
              {{ shortAddress }}
              <span v-if="isCurrentUserAdmin" class="icon is-small ml-1" title="Admin">
                <i class="fas fa-crown has-text-warning"></i>
              </span>
            </span>
            <button class="button is-danger is-small" @click="disconnect">Disconnect</button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <!-- Connection Status -->
      <div v-if="!isConnected" class="notification is-info">
        <p>Please connect your MetaMask wallet to interact with the voting contract.</p>
      </div>

      <!-- Contract Information -->
      <div v-if="isConnected" class="columns">
        <div class="column is-8">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">Contract Information</p>
            </header>
            <div class="card-content">
              <div class="content">
                <p>
                  <strong>Election Name:</strong> {{ contractInfo.electionName || 'Loading...' }}
                </p>
                <p><strong>Start Time:</strong> {{ formatTime(contractInfo.startTime) }}</p>
                <p><strong>End Time:</strong> {{ formatTime(contractInfo.endTime) }}</p>
                <p><strong>Total Votes:</strong> {{ contractInfo.totalVotes || 0 }}</p>
                <p>
                  <strong>Max Votes Per Voter:</strong> {{ contractInfo.maxVotesPerVoter || 0 }}
                </p>
                <p><strong>Is Authorized:</strong> {{ voterInfo.authorized ? 'Yes' : 'No' }}</p>
                <p><strong>Votes Cast:</strong> {{ voterInfo.votesCast || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Candidates Section -->
          <div class="card mt-4">
            <header class="card-header">
              <p class="card-header-title">Candidates</p>
              <button
                class="button is-primary is-small mr-3 mt-3"
                @click="loadCandidates"
                :disabled="isLoading"
              >
                Refresh
              </button>
            </header>
            <div class="card-content">
              <div v-if="candidates.length === 0" class="content">
                <p>No candidates found. Add some candidates to get started.</p>
              </div>
              <div v-else class="content">
                <div v-for="candidate in candidates" :key="candidate.id" class="box">
                  <div class="columns is-vcentered">
                    <div class="column">
                      <p><strong>ID:</strong> {{ candidate.id }}</p>
                      <p><strong>Name:</strong> {{ candidate.name }}</p>
                      <p><strong>Votes:</strong> {{ candidate.voteCount }}</p>
                    </div>
                    <div class="column is-narrow">
                      <button
                        class="button is-success"
                        @click="castVote(candidate.id)"
                        :disabled="!canVote || isLoading"
                      >
                        <span v-if="isLoading" class="icon is-small mr-1">
                          <i class="fas fa-spinner fa-spin"></i>
                        </span>
                        Vote
                      </button>
                      <button
                        class="button is-warning ml-2"
                        @click="revokeVote(candidate.id)"
                        :disabled="!voterInfo.authorized || isLoading"
                      >
                        <span v-if="isLoading" class="icon is-small mr-1">
                          <i class="fas fa-spinner fa-spin"></i>
                        </span>
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Winner Section -->
          <div class="card mt-4">
            <header class="card-header">
              <p class="card-header-title">Winner</p>
              <button
                class="button is-info is-small mr-3 mt-3"
                @click="getWinner"
                :disabled="isLoading"
              >
                Get Winner
              </button>
            </header>
            <div class="card-content">
              <div v-if="winner" class="content">
                <p><strong>Winner ID:</strong> {{ winner.winnerId }}</p>
                <p><strong>Winner Name:</strong> {{ winner.winnerName }}</p>
                <p><strong>Winner Votes:</strong> {{ winner.winnerVotes }}</p>
              </div>
              <div v-else class="content">
                <p>No winner determined yet or election is still ongoing.</p>
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
                Admin Functions
              </p>
            </header>
            <div class="card-content">
              <div class="content">
                <!-- Add Candidate -->
                <div class="field">
                  <label class="label">Add Candidate</label>
                  <div class="control">
                    <input
                      class="input"
                      v-model="newCandidateName"
                      placeholder="Candidate name"
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
                    Add Candidate
                  </button>
                </div>

                <hr />

                <!-- Authorize Voter -->
                <div class="field">
                  <label class="label">Authorize Voter</label>
                  <div class="control">
                    <input
                      class="input"
                      v-model="voterAddress"
                      placeholder="Voter address"
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
                    Authorize
                  </button>
                </div>

                <hr />

                <!-- End Election -->
                <button class="button is-danger" @click="endElection" :disabled="isLoading">
                  <span v-if="isLoading" class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  End Election
                </button>

                <hr />

                <!-- Restart Election -->
                <button class="button is-warning" @click="restartElection" :disabled="isLoading">
                  <span v-if="isLoading" class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Restart Election
                </button>
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
                Voter Functions
              </p>
            </header>
            <div class="card-content">
              <div class="content">
                <div class="notification is-info is-light">
                  <p><strong>Voter Account</strong></p>
                  <p>
                    You are connected as a voter. Only the contract admin can perform administrative
                    functions.
                  </p>
                  <p class="is-size-7 mt-2">
                    <strong>Admin Address:</strong>
                    {{
                      adminAddress
                        ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}`
                        : 'Loading...'
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

  // Computed
  shortAddress,
  canVote,
  isCurrentUserAdmin,

  // Methods
  connect,
  disconnect,
  loadCandidates,
  castVote,
  revokeVote,
  getWinner,
  addCandidate,
  authorizeVoter,
  endElection,
  restartElection,
  formatTime,
  setupListeners,
} = useVoting()

// Local reactive state for form inputs
const newCandidateName = ref('')
const voterAddress = ref('')

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
