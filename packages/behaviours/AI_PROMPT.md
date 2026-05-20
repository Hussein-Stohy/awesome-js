# Context & Continuation Task: Implementing Frontend Behaviors in Angular 21

You are tasked with completing the implementation and integration of the `behaviours` package located in `/packages/behaviours` inside our mono-repo.

## 1. What Already Exists in the Codebase

### A. Configuration Interface (`config/behaviours.config.ts`)
Defines the `BehavioursConfig` interface and `BEHAVIOURS_CONFIG` injection token:
- path: string
- baseURL?: string
- prefix: string
- canActivate?: any[]

### B. Angular Module (`behaviours.module.ts`)
- Declares and exports `BehaviouralDirective`.
- Dynamically provides the `Behaviours` service (from `ng-behaviours`) using a custom `getBehaviours(http: HttpClient)` factory function.
- The factory function injects `BEHAVIOURS_CONFIG` to construct request URLs dynamically.
- Provides a static `config(config: BehavioursConfig)` method returning `ModuleWithProviders<BehavioursModule>` for root configuration.

### C. Orchestration Directive (`directives/behavioural.directive.ts`)
- Selector: `[behavioural]`
- ExportAs: `behavioural` (to allow template state access like `#btnBehavior="behavioural"`)
- Input: `behavioural?: Signal<Command>`
- Output: `transition = new EventEmitter<Event>()` (Emit structured events e.g., `{ type: 'success' | 'error', payload?: any, error?: any }`)
- Defines `Command` and `Event` interfaces.
- Uses `@HostListener('click')` (or similar trigger) to initiate the execution, while using Angular `effect()` to keep the underlying `Command` payload fresh.
- Manages internal state (`isPending`, `hasError`) and exposes it to the template.
- Runs validation locally, unsubscribes from previous in-flight requests, and dynamic-dispatches calls to the `Behaviours` client.

---

## 2. Your Exact Scope of Work

Please implement the following steps carefully without breaking the established architecture.

### Step 1: Create Public API Entry Point

1. In the root folder of `/packages/behaviours`, create an `index.ts` file.
2. Export all core components so external apps in the workspace can import them cleanly:

export { BehavioursModule } from './behaviours.module';
export { BehaviouralDirective, Command, Event } from './directives/behavioural.directive';
export { BehavioursConfig, BEHAVIOURS_CONFIG } from './config/behaviours.config';

3. Update the package.json `main` entry if needed to point to the generated entry point.

---

### Step 2: Implement Unit and Integration Tests

Create test files under:

`/packages/behaviours/directives/behavioural.directive.spec.ts`

Use Jasmine or Jest and cover the following:

- Dynamic Method Dispatch:
  Verify that assigning a command like:
  `{ name: 'CreateUser', parameters: { name: 'Hussein' } }`
  correctly invokes:
  `behaviours['CreateUser']({ name: 'Hussein' })`

- Local Validation:
  Mock a validation function that fails and verify:
  - transition emits an error
  - no HTTP behavior call is executed

- Reactive Cleanup:
  Verify that when the Signal updates with a new command:
  - the previous RxJS subscription is unsubscribed

- Data Projection:
  Verify that:
  - `returns`
  - `error`
  mappers correctly transform raw outputs.

---

### Step 3: Implement Reusable Business Behavior Builders

Create:

`packages/behaviours/utils/behavior.builder.ts`

Define helper functions/factory patterns for creating typed reusable behaviors.

Goal:
Allow developers to define reusable behavior templates like:

- SubmitFormBehavior
- SearchFilterBehavior
- ChangePasswordBehavior

without manually writing raw command objects in components.

Use generics where possible:
`<TParameters, TResult>`

---

### Step 4: Verification and Integration Example

Create or identify an example component inside the workspace.

Suggested location:
`/examples`

Tasks:

1. Register:
`BehavioursModule.config({ baseURL: '...', prefix: '...' })`

2. Build a simple Angular example demonstrating how to use the directive. **You must implement an example component matching this structure:**

**`user-creation.component.ts`**
```typescript
import { Component, signal } from '@angular/core';
import { Command, Event } from '@behaviours/directives/behavioural.directive';

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html'
})
export class UserCreationComponent {
  // Define the intent (Command) as a Signal
  createUserCommand = signal<Command>({
    name: 'CreateUser',
    parameters: { name: 'Hussein', role: 'Admin' },
    validate: () => true // Local validation logic
  });

  // Handle the resulting transition
  onTransition(event: Event) {
    if (event.type === 'success') {
      console.log('User created:', event.payload);
    } else if (event.type === 'error') {
      console.error('Creation failed:', event.error);
    }
  }
}
```

**`user-creation.component.html`**
```html
<!-- The HTML acts purely as a trigger and state renderer -->
<button
  #behaviorCtrl="behavioural"
  [behavioural]="createUserCommand"
  (transition)="onTransition($event)"
  [disabled]="behaviorCtrl.isPending()">
  
  @if (behaviorCtrl.isPending()) {
    <span>Loading...</span>
  } @else {
    <span>Create User</span>
  }
</button>

@if (behaviorCtrl.hasError()) {
  <div class="error-state">Failed to create user.</div>
}
```

3. Ensure the example Demonstrates:

- validation timing (on click/trigger)
- template state exposure (`isPending()`, `hasError()`)
- success transition handling
- error handling
- Angular Signals integration

---

## Technical Constraints & Best Practices

- Do NOT rewrite the current dynamic dispatch logic in `BehaviouralDirective`.
- Keep using:
  `behavioursAny[name](parameters)`

- Ensure strict subscription cleanup:
  - on `ngOnDestroy`
  - on command Signal updates

- Maintain strong TypeScript typing.

- Preserve existing folder structure and architecture.

- Extend the package only; do not redesign it from scratch.

The main goal of the `behaviours` module is to provide a frontend behavior layer that allows the application to work around business behaviors instead of traditional event-based logic.

Instead of every component handling logic like:

click -> call service -> handle response -> update state

we define a complete behavior representing a business intent such as:

* CreateUser
* SubmitForm
* SearchProducts

The module is responsible for:

* receiving commands from the component
* running validation
* dispatching the correct behavior
* handling transitions (success/error)
* projecting results back to the UI in a consistent way

Usage Flow:

Inside the component:
we prepare a `Signal<Command>` containing:

* behavior name
* parameters
* validation (runs right before execution)
* mapping/projection logic

Inside the HTML:
we bind it using the directive and expose its state via a template variable:

```html
<button
  #submitBtn="behavioural"
  [behavioural]="command"
  (transition)="onTransition($event)"
  [disabled]="submitBtn.isPending()">
  {{ submitBtn.isPending() ? 'Executing...' : 'Execute' }}
</button>
```

The HTML becomes only a behavior trigger and state renderer,
the component provides the semantic intent via Signals,
and the module handles the full business execution flow, exposing internal states directly to the template.

Final objective:
Move the frontend architecture from simple event-driven interactions to behavior-driven interactions aligned with Behavioral Modeling concepts.
