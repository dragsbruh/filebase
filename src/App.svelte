<script lang="ts">
  import { Router, Route } from "svelte-routing";
  import LandingPage from "./pages/LandingPage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ViewerPage from "./pages/ViewerPage.svelte";
  import Notification from "./components/Notification.svelte";
  import notify from "./stores/notification";

  export let url;
</script>

<section class="section">
  <Router {url}>
    <Route path="/" component={LandingPage} />
    <Route path="/app/:name" let:params>
      <ViewerPage
        params={{
          ...params,
        }}
      />
    </Route>
    <Route path="/app/:name/*" let:params>
      <ViewerPage {params} />
    </Route>
    <Route path="/*" component={NotFoundPage} />
  </Router>
  <Notification />
</section>
