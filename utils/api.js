const { request } = require('./request')

function createRoom() {
  return request({
    url: '/rooms',
    method: 'POST'
  })
}

function joinRoom(roomCode) {
  return request({
    url: '/rooms/join',
    method: 'POST',
    data: { roomCode }
  })
}

function getRoom(roomId) {
  return request({
    url: `/rooms/${roomId}`
  })
}

function getTransactions(roomId, page = 1, limit = 20) {
  return request({
    url: `/transactions?roomId=${encodeURIComponent(roomId)}&page=${page}&limit=${limit}`
  })
}

function getSettlement(roomId) {
  return request({
    url: `/settlements/${roomId}`
  })
}

function createSettlement(roomId) {
  return request({
    url: `/settlements/${roomId}`,
    method: 'POST'
  })
}

function getHistoryRooms(page = 1, limit = 20) {
  return request({
    url: `/history/rooms?page=${page}&limit=${limit}`
  })
}

function getHistoryRoomTransactions(roomId, page = 1, limit = 20) {
  return request({
    url: `/history/rooms/${roomId}/transactions?page=${page}&limit=${limit}`
  })
}

function updateNickname(nickname) {
  return request({
    url: '/auth/nickname',
    method: 'PUT',
    data: { nickname }
  })
}

function updateProfile(nickname, avatarUrl) {
  return request({
    url: '/auth/profile',
    method: 'PUT',
    data: { nickname, avatarUrl }
  })
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getTransactions,
  getSettlement,
  createSettlement,
  getHistoryRooms,
  getHistoryRoomTransactions,
  updateNickname,
  updateProfile
}
