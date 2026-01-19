<script setup lang="ts">
definePageMeta({
  layout: false,
})

const router = useRouter()

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-linear-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-6 h-6 text-white" />
          </div>
          <span
            class="text-2xl font-bold bg-linear-to-br from-primary-600 to-primary-800 bg-clip-text text-transparent">BuildingMS</span>
        </div>
        <div class="flex gap-3">
          <UButton color="neutral" variant="ghost" size="lg" @click="goToLogin">Sign In</UButton>
          <UButton color="primary" size="lg" @click="goToRegister">Get Started Free</UButton>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-24 overflow-hidden min-h-screen flex items-center">
      <div class="absolute inset-0 z-0">
        <NuxtImg src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80" alt="Modern buildings"
          class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-linear-to-br from-primary-900/80 via-primary-800/70 to-primary-900/80"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-8">
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span class="text-sm font-medium">Trusted by 10,000+ property managers</span>
        </div>

        <h1 class="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Property Management<br />
          <span class="bg-linear-to-r from-primary-200 to-white bg-clip-text text-transparent">Made Simple</span>
        </h1>

        <p class="text-xl text-primary-100 mb-10 max-w-3xl mx-auto leading-relaxed">
          The all-in-one platform to manage buildings, track tenants, handle maintenance,
          and grow your property portfolio. Start free, scale as you grow.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <UButton size="xl" color="primary" class="px-8 shadow-xl" @click="goToRegister">
            <span class="flex items-center gap-2">
              Start Free Trial
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
            </span>
          </UButton>
          <div class="flex items-center gap-2 text-white text-sm">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-300" />
            <span>No credit card required</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-white/20">
          <div>
            <div class="text-4xl font-bold text-white mb-1">10K+</div>
            <div class="text-primary-200 text-sm">Active Users</div>
          </div>
          <div>
            <div class="text-4xl font-bold text-white mb-1">50K+</div>
            <div class="text-primary-200 text-sm">Properties Managed</div>
          </div>
          <div>
            <div class="text-4xl font-bold text-white mb-1">99.9%</div>
            <div class="text-primary-200 text-sm">Uptime</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Showcase -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-5xl font-bold text-gray-900 mb-4">
            Everything You Need in One Place
          </h2>
          <p class="text-xl text-gray-600">Powerful features designed for modern property management</p>
        </div>

        <!-- Feature 1 - Tenant Management -->
        <div class="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <UIcon name="i-heroicons-users" class="w-4 h-4" />
              Tenant Management
            </div>
            <h3 class="text-4xl font-bold text-gray-900 mb-4">
              Manage Tenants Effortlessly
            </h3>
            <p class="text-lg text-gray-600 mb-6">
              Keep track of all your tenants, leases, and renewals in one centralized dashboard.
              Automated reminders ensure you never miss important dates.
            </p>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Digital lease agreements with e-signatures</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Automatic renewal notifications</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Tenant portal for self-service</span>
              </li>
            </ul>
          </div>
          <div class="relative">
            <div
              class="absolute -inset-4 bg-linear-to-r from-primary-600 to-primary-400 rounded-2xl blur-2xl opacity-20">
            </div>
            <NuxtImg src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
              alt="Tenant management dashboard" class="relative rounded-2xl shadow-2xl" loading="lazy" />
          </div>
        </div>

        <!-- Feature 2 - Payment Tracking -->
        <div class="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div class="order-2 md:order-1 relative">
            <div class="absolute -inset-4 bg-linear-to-r from-green-600 to-emerald-400 rounded-2xl blur-2xl opacity-20">
            </div>
            <NuxtImg src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80" alt="Payment tracking"
              class="relative rounded-2xl shadow-2xl" loading="lazy" />
          </div>
          <div class="order-1 md:order-2">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
              <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4" />
              Financial Tracking
            </div>
            <h3 class="text-4xl font-bold text-gray-900 mb-4">
              Never Miss a Payment
            </h3>
            <p class="text-lg text-gray-600 mb-6">
              Track rent payments, generate invoices, and get real-time financial insights.
              Automated reminders keep your cash flow healthy.
            </p>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Automated payment reminders</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Detailed financial reports</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Export to accounting software</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Feature 3 - Maintenance -->
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
              <UIcon name="i-heroicons-wrench-screwdriver" class="w-4 h-4" />
              Maintenance Management
            </div>
            <h3 class="text-4xl font-bold text-gray-900 mb-4">
              Handle Requests Efficiently
            </h3>
            <p class="text-lg text-gray-600 mb-6">
              Streamline maintenance requests with priority tracking, vendor management,
              and real-time updates for tenants.
            </p>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Priority-based request queue</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Vendor assignment and tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <span class="text-gray-700">Tenant status updates</span>
              </li>
            </ul>
          </div>
          <div class="relative">
            <div class="absolute -inset-4 bg-linear-to-r from-orange-600 to-yellow-400 rounded-2xl blur-2xl opacity-20">
            </div>
            <NuxtImg src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"
              alt="Maintenance management" class="relative rounded-2xl shadow-2xl" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl text-gray-600">Choose the plan that fits your portfolio</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Free Plan -->
          <div
            class="relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all">
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-bold text-gray-900">$0</span>
                <span class="text-gray-600">/year</span>
              </div>
            </div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">1 Building</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Up to 30 Units</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">5 Team Members</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Basic Support</span>
              </li>
            </ul>
            <UButton block size="lg" color="neutral" variant="outline" @click="goToRegister">
              Get Started
            </UButton>
          </div>

          <!-- Pro Plan -->
          <div
            class="relative p-8 bg-linear-to-br from-primary-600 to-primary-700 rounded-2xl shadow-2xl transform scale-105">
            <div
              class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 text-sm font-bold rounded-full">
              MOST POPULAR
            </div>
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Pro</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-bold text-white">$499</span>
                <span class="text-primary-100">/year</span>
              </div>
            </div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-300 shrink-0" />
                <span class="text-white">Up to 5 Buildings</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-300 shrink-0" />
                <span class="text-white">50 Units per Building</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-300 shrink-0" />
                <span class="text-white">Unlimited Team Members</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-300 shrink-0" />
                <span class="text-white">Priority Support</span>
              </li>
            </ul>
            <UButton block size="lg" color="primary" @click="goToRegister">
              Get Started
            </UButton>
          </div>

          <!-- Enterprise Plan -->
          <div
            class="relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all">
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-bold text-gray-900">$1,999</span>
                <span class="text-gray-600">/year</span>
              </div>
            </div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Unlimited Buildings</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Unlimited Units</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Unlimited Team Members</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-green-500 shrink-0" />
                <span class="text-gray-700">Dedicated Support</span>
              </li>
            </ul>
            <UButton block size="lg" color="neutral" variant="outline">
              Contact Sales
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-24 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <NuxtImg src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80" alt="Modern office"
          class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-linear-to-r from-gray-900/95 to-gray-900/90"></div>
      </div>

      <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-5xl font-bold text-white mb-6">
          Ready to Transform Your Property Management?
        </h2>
        <p class="text-xl text-gray-300 mb-10">
          Join thousands of property managers who have streamlined their operations with BuildingMS
        </p>
        <UButton size="xl" color="primary" class="px-10 shadow-2xl" @click="goToRegister">
          <span class="flex items-center gap-2">
            Start Your Free Trial
            <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
          </span>
        </UButton>
        <p class="text-sm text-gray-400 mt-6">No credit card required • Cancel anytime</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center gap-3 mb-4 md:mb-0">
            <div
              class="w-8 h-8 rounded-lg bg-linear-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <UIcon name="i-heroicons-building-office-2" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-white">BuildingMS</span>
          </div>
          <p class="text-sm">&copy; 2026 BuildingMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>