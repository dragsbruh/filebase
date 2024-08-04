<script lang="ts">
  import { Router, Route } from "svelte-routing";
  import LandingPage from "./pages/LandingPage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ViewerPage from "./pages/ViewerPage.svelte";

  export let url;
</script>

<Router {url}>
  <Route path="/" component={LandingPage} />
  <Route path="/fs/:name" let:params>
    <ViewerPage
      params={{
        ...params,
      }}
    />
  </Route>
  <Route path="/fs/:name/*" let:params>
    <ViewerPage {params} />
  </Route>
  <Route path="/*" component={NotFoundPage} />
</Router>
