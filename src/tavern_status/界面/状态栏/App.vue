<template>
  <OpeningForm v-if="phase === 'opening'" @complete="onOpeningComplete" />

  <div v-show="phase === 'game'" class="app-wrap">
    <span class="corner c1"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="corner c2"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="corner c3"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>
    <span class="corner c4"
      ><svg viewBox="0 0 24 24"><path d="M2 12c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" /></svg
    ></span>

    <div class="app-layout">
      <Sidebar v-model="currentPage" />
      <section class="main-area">
        <div class="pages">
          <StoryPage v-show="currentPage === 'story'" />
          <TavernPage v-show="currentPage === 'tavern'" />
          <InventoryPage v-show="currentPage === 'inventory'" />
          <ShoppingPage v-show="currentPage === 'shopping'" />
          <LedgerPage v-show="currentPage === 'ledger'" />
          <ProfilePage v-show="currentPage === 'profile'" />
          <RolesPage v-show="currentPage === 'roles'" />
          <MapPage v-show="currentPage === 'map'" />
          <FarmingPage v-show="currentPage === 'farming'" />
          <BrewingPage v-show="currentPage === 'brewing'" />
          <ConstructionPage v-show="currentPage === 'construction'" />
          <EmployeesPage v-show="currentPage === 'employees'" />
          <BusinessPage v-show="currentPage === 'business'" />
          <AdventurePage v-show="currentPage === 'adventure'" />
          <RelationshipsPage v-show="currentPage === 'relationships'" />
          <DebugPage v-show="currentPage === 'debug'" />
        </div>
        <OutputDock />
      </section>
    </div>
    <SettingsPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useDataStore } from './store';
import type { GamePhase } from '../../types';

import OpeningForm from './components/OpeningForm.vue';
import Sidebar from './components/Sidebar.vue';
import OutputDock from './components/OutputDock.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import StoryPage from './components/StoryPage.vue';
import TavernPage from './components/TavernPage.vue';
import InventoryPage from './components/InventoryPage.vue';
import ShoppingPage from './components/ShoppingPage.vue';
import LedgerPage from './components/LedgerPage.vue';
import ProfilePage from './components/ProfilePage.vue';
import RolesPage from './components/RolesPage.vue';
import MapPage from './components/MapPage.vue';
import FarmingPage from './components/FarmingPage.vue';
import BrewingPage from './components/BrewingPage.vue';
import ConstructionPage from './components/ConstructionPage.vue';
import EmployeesPage from './components/EmployeesPage.vue';
import BusinessPage from './components/BusinessPage.vue';
import AdventurePage from './components/AdventurePage.vue';
import RelationshipsPage from './components/RelationshipsPage.vue';
import DebugPage from './components/DebugPage.vue';
import { loadCurrentSave } from '../../engineBridge';

const store = useDataStore();
const currentPage = ref('story');
const phase = ref<GamePhase>('game');

function detectPhase() {
  try {
    const lastMessageId = getLastMessageId();
    console.info('[App] 当前楼层数:', lastMessageId);
    phase.value = lastMessageId === 0 ? 'opening' : 'game';
  } catch (error) {
    console.error('[App] 检测楼层失败，默认显示开局', error);
    phase.value = 'opening';
  }
}

function onOpeningComplete() {
  phase.value = 'game';
  loadCurrentSave();
}

onMounted(() => {
  detectPhase();
});

provide('store', store);
provide('currentPage', currentPage);
</script>
