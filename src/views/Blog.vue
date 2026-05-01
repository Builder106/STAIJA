<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Motion } from 'motion-v'
import { Icon } from '@iconify/vue'
import Container from '../components/ui/Container.vue'
import Section from '../components/ui/Section.vue'
import Heading from '../components/ui/Heading.vue'
import Body from '../components/ui/Body.vue'
import Eyebrow from '../components/ui/Eyebrow.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'

const POSTS = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  slug: `post-${i}`,
  title: [
    'How to run a PCR test when the power goes out',
    'My journey from Kano to Cambridge',
    'Why pan-African science collaboration matters',
    'Meet the 2024 StepUp Scholars',
    'Designing low-cost lab equipment',
    'The ethics of global health research',
  ][i % 6],
  dek: 'A brief look into the creative problem solving required to do rigorous science in resource-constrained environments.',
  eyebrow: ['StepUp · Research · Oct 12', 'Dynamerge · Stories · Sep 24', 'News · Aug 05'][i % 3],
  author: ['Chinedu Okafor', 'Amina Yusuf', 'Dr. Sarah Nwachukwu'][i % 3],
  img: [
    'https://images.unsplash.com/photo-1758573467240-f944226c2026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'https://images.unsplash.com/photo-1625082361965-1139be607018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'https://images.unsplash.com/photo-1658252844173-ba5de80a3015?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'https://images.unsplash.com/photo-1753357278474-74cd2cac70ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  ][i % 4],
  featured: i === 0,
}))

const filters = ['All', 'StepUp', 'Dynamerge', 'Research', 'Stories', 'News']
const activeFilter = ref('All')
const search = ref('')
const page = ref(1)

const featured = POSTS[0]
const gridPosts = POSTS.slice(1, 10)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pb-8 !pt-12 md:!pt-16">
      <Container>
        <Heading :level="1" class="mb-12">Stories from <span class="text-brand-violet">the lab</span>.</Heading>

        <Motion :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.4 }">
          <RouterLink :to="`/blog/${featured.slug}`" class="group block focus-ring-brand rounded-2xl">
            <UiCard class="grid md:grid-cols-2 lg:grid-cols-5 gap-0 overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:shadow-ink/5">
              <div class="lg:col-span-3 aspect-[4/3] md:aspect-auto h-full w-full relative overflow-hidden">
                <div class="absolute inset-0 bg-ink/10 group-hover:bg-transparent transition-colors z-10" />
                <img
                  :src="featured.img"
                  :alt="featured.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div class="lg:col-span-2 p-8 md:p-12 flex flex-col justify-center bg-white h-full">
                <Eyebrow class="text-brand-violet mb-4">{{ featured.eyebrow }}</Eyebrow>
                <Heading :level="2" class="!text-3xl md:!text-4xl mb-4 group-hover:text-brand-violet transition-colors">
                  {{ featured.title }}
                </Heading>
                <Body large class="mb-8">{{ featured.dek }}</Body>
                <div class="mt-auto pt-6 border-t hairline-ink flex items-center justify-between">
                  <span class="text-sm font-semibold text-ink/70">By {{ featured.author }}</span>
                  <Icon icon="lucide:arrow-right" width="20" class="text-brand-violet transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </UiCard>
          </RouterLink>
        </Motion>
      </Container>
    </Section>

    <Section class="!py-8 sticky top-[80px] z-40 bg-paper/80 backdrop-blur-md border-y hairline-ink">
      <Container>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex overflow-x-auto pb-2 md:pb-0 gap-2 -mx-6 px-6 md:mx-0 md:px-0">
            <button
              v-for="f in filters"
              :key="f"
              type="button"
              class="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold font-sans border transition-colors whitespace-nowrap"
              :class="activeFilter === f
                ? 'bg-gradient-brand text-white border-transparent shadow-sm'
                : 'bg-white text-ink border-ink/10 hover:border-ink/20'"
              @click="activeFilter = f"
            >
              {{ f }}
            </button>
          </div>
          <div class="relative shrink-0 md:w-64">
            <Icon icon="lucide:search" width="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
            <input
              v-model="search"
              type="text"
              placeholder="Search stories..."
              class="w-full pl-10 pr-4 py-2 bg-white border hairline-ink rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet transition-all"
            />
          </div>
        </div>
      </Container>
    </Section>

    <Section class="!pt-12 !pb-24 bg-white">
      <Container>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          <Motion
            v-for="(post, i) in gridPosts"
            :key="post.id"
            :initial="{ opacity: 0, y: 20 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, margin: '-50px' }"
            :transition="{ duration: 0.4, delay: (i % 3) * 0.1 }"
          >
            <RouterLink :to="`/blog/${post.slug}`" class="group flex flex-col h-full focus-ring-brand rounded-2xl p-2 -m-2">
              <div class="aspect-[16/10] rounded-xl overflow-hidden mb-6 relative border hairline-ink">
                <div class="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                <img :src="post.img" :alt="post.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div class="flex flex-col flex-1 gap-3">
                <Eyebrow class="text-ink/50">{{ post.eyebrow }}</Eyebrow>
                <Heading :level="3" class="!text-2xl group-hover:text-brand-violet transition-colors line-clamp-2">
                  {{ post.title }}
                </Heading>
                <Body class="text-ink/70 line-clamp-2 mb-4">{{ post.dek }}</Body>
                <div class="mt-auto pt-4 border-t hairline-ink text-sm font-semibold text-ink/60">
                  By {{ post.author }}
                </div>
              </div>
            </RouterLink>
          </Motion>
        </div>

        <div class="mt-16 flex items-center justify-center gap-2">
          <UiButton
            variant="secondary"
            class="!w-10 !h-10 !p-0 !rounded-full"
            :disabled="page === 1"
            @click="page = Math.max(1, page - 1)"
          >
            <Icon icon="lucide:chevron-left" width="18" />
          </UiButton>
          <span class="text-sm font-semibold mx-4 text-ink/60">Page {{ page }} of 4</span>
          <UiButton
            variant="secondary"
            class="!w-10 !h-10 !p-0 !rounded-full"
            @click="page = page + 1"
          >
            <Icon icon="lucide:chevron-right" width="18" />
          </UiButton>
        </div>
      </Container>
    </Section>

    <!-- Donate Prompt -->
    <Section class="bg-paper border-t hairline-ink text-center">
      <Container class="max-w-2xl flex flex-col items-center">
        <Heading :level="2" class="mb-4">Power more stories.</Heading>
        <Body large class="mb-8 text-ink/70">
          Every breakthrough starts with an opportunity. Your donation funds stipends,
          materials, and travel for our scholars.
        </Body>
        <UiButton variant="primary" :to="'/donate'" class="!px-8 text-base">
          Donate to STAIJA
        </UiButton>
      </Container>
    </Section>
  </div>
</template>
