/* The VARIABLES form (tool plan §4) — six accordion panels, one per subheading of the source
   prompt, generated from LevierDefaults.SECTIONS.

   Nothing about the fields is written twice: the same metadata that orders the prompt orders the
   form, so adding a variable is one entry in levier-defaults.js and it appears in both. `control`
   picks the widget, `kind` picks how the prompt renders it.

   The model is the parent's reactive variables object and is mutated in place. That is deliberate:
   the alternative is an emit per nested key, and the parent owns this object for the life of the
   page anyway (it is what autosave will persist in batch 7).

   Formatting is PrimeVue's own Intl wiring — mode="currency" with the Canadian locale, a percent
   suffix — so the visitor never types a separator or a sign, and the model holds a Number
   (design.md §11, Financial inputs). */

window.VariablesForm = {
  /* Tool-specific, so the tool registers it — the shell's component list stays shell-wide. */
  components: { AutoField: window.AutoField },
  props: {
    variables: { type: Object, required: true },
    notices: { type: Array, default: function () { return []; } }
  },
  setup: function (props) {
    const i18n = window.i18n;
    const D = window.LevierDefaults;

    /* Every panel open on arrival: the visitor is here to read the whole prompt, and a collapsed
       accordion would hide the defaults that are the point of the tool (design.md §9). */
    const open = Vue.ref(D.SECTIONS.map(function (section) { return section.key; }));

    function group(section) { return props.variables[section.key]; }

    /* A field is either a bare value or { auto, value }; read and write through one pair so the
       template never branches on it. */
    function isAuto(section, field) {
      const stored = group(section)[field.key];
      return !!(stored && typeof stored === 'object' && !Array.isArray(stored) && stored.auto);
    }

    function read(section, field) {
      const stored = group(section)[field.key];
      return field.auto ? stored.value : stored;
    }

    function write(section, field, next) {
      if (field.auto) group(section)[field.key] = { auto: isAuto(section, field), value: next };
      else group(section)[field.key] = next;
    }

    /* Chips come back as strings; a numeric list has to go back into the model as numbers or the
       prompt renders "5" through the text path and the math in phase 3 would silently coerce. */
    function writeChips(section, field, next) {
      const numeric = field.kind === 'yearList' || field.kind === 'rateList';
      write(section, field, (next || []).map(function (entry) {
        if (!numeric) return String(entry).trim();
        const parsed = Number(String(entry).replace(',', '.').trim());
        return isFinite(parsed) ? parsed : null;
      }).filter(function (entry) { return entry !== null && entry !== ''; }));
    }

    return {
      t: i18n.t,
      lang: i18n.lang,
      sections: D.SECTIONS,
      options: D.OPTIONS,
      open: open,
      isAuto: isAuto,
      read: read,
      write: write,
      writeChips: writeChips,
      group: group,

      /* PrimeVue wants { label, value }; the registry stores { label: { fr, en }, value }. Doing
         the pick here keeps every select a plain optionLabel binding with no slot template. */
      localized: function (field) {
        return (D.OPTIONS[field.options] || []).map(function (option) {
          return { value: option.value, label: option.label[i18n.lang.value] };
        });
      },

      locale: Vue.computed(function () { return window.Format.LOCALE[i18n.lang.value]; }),
      /* fr-CA puts a space before the sign, en-CA does not — the same rule Intl applies. */
      percentSuffix: Vue.computed(function () {
        return i18n.lang.value === 'fr' ? ' %' : '%';
      }),
      fieldId: function (section, field) { return 'levier-' + section.key + '-' + field.key; },
      noticeFor: function (section, field) {
        return props.notices.find(function (notice) {
          return notice.section === section.key && notice.field === field.key;
        });
      },
      /* No suggestions: AutoComplete in multiple mode with typeahead off is the chips input. */
      noSuggestions: function () { return []; }
    };
  },
  template: `
    <PAccordion :value="open" multiple @update:value="open = $event">
      <PAccordionPanel v-for="section in sections" :key="section.key" :value="section.key">
        <PAccordionHeader>{{ section.heading[lang] }}</PAccordionHeader>
        <PAccordionContent>
          <div class="field-grid">
            <div v-for="field in section.fields" :key="field.key"
                 class="field"
                 :class="{ 'field-wide': field.control === 'chips' ||
                                         field.control === 'multiSelect' ||
                                         field.control === 'sliderNumber' }">

              <label :for="fieldId(section, field)">{{ field.label[lang] }}</label>

              <PInputNumber v-if="field.control === 'currency'"
                            :model-value="read(section, field)"
                            @update:model-value="write(section, field, $event)"
                            :inputId="fieldId(section, field)"
                            mode="currency" currency="CAD" :locale="locale"
                            :min="field.min" :max="field.max"
                            :minFractionDigits="0" :maxFractionDigits="2"
                            :disabled="isAuto(section, field)"
                            :invalid="!!noticeFor(section, field)"
                            :aria-describedby="field.auto ? fieldId(section, field) + '-auto-hint' : null"
                            fluid />

              <PInputNumber v-else-if="field.control === 'percent'"
                            :model-value="read(section, field)"
                            @update:model-value="write(section, field, $event)"
                            :inputId="fieldId(section, field)"
                            :locale="locale" :suffix="percentSuffix"
                            :min="field.min" :max="field.max" :step="field.step || 0.1"
                            :minFractionDigits="0" :maxFractionDigits="2"
                            :disabled="isAuto(section, field)"
                            :invalid="!!noticeFor(section, field)"
                            :aria-describedby="field.auto ? fieldId(section, field) + '-auto-hint' : null"
                            fluid />

              <PInputNumber v-else-if="field.control === 'number'"
                            :model-value="read(section, field)"
                            @update:model-value="write(section, field, $event)"
                            :inputId="fieldId(section, field)"
                            :locale="locale"
                            :min="field.min" :max="field.max" :step="field.step || 1"
                            :disabled="isAuto(section, field)"
                            fluid />

              <div v-else-if="field.control === 'sliderNumber'" class="field-slider">
                <PInputNumber :model-value="read(section, field)"
                              @update:model-value="write(section, field, $event)"
                              :inputId="fieldId(section, field)"
                              :locale="locale" :min="field.min" :max="field.max"
                              :suffix="' ' + t('levier.years')" />
                <PSlider :model-value="read(section, field)"
                         @update:model-value="write(section, field, $event)"
                         :min="field.min" :max="field.max"
                         :aria-label="field.label[lang]" />
              </div>

              <PSelect v-else-if="field.control === 'select'"
                       :model-value="read(section, field)"
                       @update:model-value="write(section, field, $event)"
                       :inputId="fieldId(section, field)"
                       :options="localized(field)" optionLabel="label" optionValue="value"
                       :disabled="isAuto(section, field)"
                       :invalid="!!noticeFor(section, field)"
                       fluid />

              <PSelectButton v-else-if="field.control === 'selectButton'"
                             :model-value="read(section, field)"
                             @update:model-value="write(section, field, $event)"
                             :options="localized(field)"
                             optionLabel="label" optionValue="value"
                             :aria-label="field.label[lang]" />

              <PMultiSelect v-else-if="field.control === 'multiSelect'"
                            :model-value="read(section, field)"
                            @update:model-value="write(section, field, $event)"
                            :inputId="fieldId(section, field)"
                            :options="localized(field)"
                            optionLabel="label" optionValue="value"
                            display="chip" :showToggleAll="false"
                            :aria-label="field.label[lang]"
                            fluid />

              <PToggleSwitch v-else-if="field.control === 'toggle'"
                             :model-value="read(section, field)"
                             @update:model-value="write(section, field, $event)"
                             :inputId="fieldId(section, field)"
                             :aria-label="field.label[lang]" />

              <PAutoComplete v-else-if="field.control === 'chips'"
                             :model-value="read(section, field)"
                             @update:model-value="writeChips(section, field, $event)"
                             :inputId="fieldId(section, field)"
                             multiple :typeahead="false" @complete="noSuggestions"
                             :aria-describedby="fieldId(section, field) + '-chips-hint'"
                             fluid />

              <p v-if="field.control === 'chips'" class="field-help"
                 :id="fieldId(section, field) + '-chips-hint'">{{ t('levier.chipsHint') }}</p>

              <PInputText v-if="field.other && read(section, field) === 'other'"
                          :model-value="group(section)[field.other]"
                          @update:model-value="group(section)[field.other] = $event"
                          :aria-label="field.label[lang]"
                          :placeholder="t('levier.otherPlaceholder')"
                          fluid />

              <AutoField v-if="field.auto"
                         :model-value="group(section)[field.key]"
                         @update:model-value="group(section)[field.key] = $event"
                         :instruction="field.auto[lang]"
                         :input-id="fieldId(section, field)" />

              <PMessage v-if="noticeFor(section, field)" severity="warn" :closable="false">
                {{ t('levier.warn.' + noticeFor(section, field).id,
                      noticeFor(section, field).params) }}
              </PMessage>
            </div>
          </div>
        </PAccordionContent>
      </PAccordionPanel>
    </PAccordion>
  `
};
