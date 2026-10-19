export type ResourceCategory = 'Guide' | 'Industry' | 'Comparison' | 'Glossary' | 'Journal';
export interface ContentSection { title: string; paragraphs: string[]; points?: string[] }
export interface PublicResource {
 slug: string; category: ResourceCategory; title: string; summary: string; sections: ContentSection[];
 sources?: Array<{title: string; url: string}>; related: string[];
 example?: [string, string, string, string]; comparison?: Array<[string, string, string]>;
 faqs?: Array<[string, string]>;
}
export const references = {
 vda: {title:'VDA QMC: overview of the seven-step FMEA approach',url:'https://vda-qmc.de/wp-content/uploads/2023/06/VDA-QMC-White-Paper-FMEA-Englisch.pdf'},
 errata: {title:'AIAG/VDA FMEA Handbook: June 2020 errata',url:'https://www.aiag.org/docs/default-source/training-and-resources/erratta-documents/aiag-vda-fmea-handbook-errata-june-2020.pdf'},
 flow: {title:'ASQ: flowcharts and process mapping',url:'https://asq.org/quality-resources/flowchart'},
 part11: {title:'Electronic Code of Federal Regulations: 21 CFR Part 11',url:'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11'},
 bosch: {title:'Bosch: supplier quality requirements',url:'https://assets.bosch.com/media/global/bosch_group/purchasing_and_logistics/information_for_business_partners/downloads/quality_docs/specific_regulations/supplier-quality-requirements.pdf'},
 apis: {title:'APIS: IQ software product information',url:'https://www.apis-iq.com/software/'},
 isoMedical: {title:'ISO: ISO 13485 medical devices quality management',url:'https://www.iso.org/iso-13485-medical-devices.html'},
 iaqg: {title:'IAQG: 9100 series quality management systems',url:'https://iaqg.org/standard/9100-qms-requirements-for-aviation-space-and-defense-organizations/'},
 jedec: {title:'JEDEC: standards and documents',url:'https://www.jedec.org/standards-documents'},
};
export const resources: PublicResource[] = [
 {
  slug:'aiag-vda-7-step-fmea',category:'Guide',title:'Seven steps. One connected engineering analysis.',
  summary:'Use planning, structure, functions, failures, risk, optimization, and results documentation as a connected method—not seven isolated forms.',
  sections:[
   {title:'Plan the analysis before filling the form',paragraphs:['Agree on the product or process boundary, responsibilities, available knowledge, and review milestones. Record assumptions and relevant customer requirements. A previous FMEA can be a starting point; it still needs review against the actual scope.'],points:['Define what is included and excluded.','Identify the cross-functional team and decision owners.','Record the applicable handbook edition, rating profile, and customer requirements.']},
   {title:'Separate routing from the structure tree',paragraphs:['A process flow diagram describes how the manufacturing process moves, branches, and returns. The PFMEA structure tree organizes the process item, process steps, and work elements. They support each other but answer different questions. In design analysis, identify the system boundary and the components inside it.']},
   {title:'Connect functions and failures',paragraphs:['State what the selected element must do, under which conditions, and against which requirement. Then connect a cause to a failure mode and its effects. The same physical issue can sit at a different level when the focus element changes; keep the relationship explicit instead of duplicating disconnected text.']},
   {title:'Evaluate current controls and plan improvement',paragraphs:['Assess severity, occurrence, and detection using the applicable rating criteria. Record the basis for each judgment. Action Priority supports the discussion about prevention and detection actions; it is not a certificate that a risk is acceptable. Assign an owner and a date, then evaluate effectiveness before recording revised ratings.']},
   {title:'Document results and continue learning',paragraphs:['Summarize the analysis scope, important decisions, unresolved issues, and action outcomes. Review and approval are part of the organization’s document workflow. An approved revision preserves a baseline; future changes need their own controlled review. Draft analysis is iterative, so new information may require revisiting an earlier step.']},
  ],sources:[references.vda,references.errata],related:['pfd-pfmea-linking','action-priority','control-plan-sync'],
  faqs:[['Must every draft step be finished before exploring the next?','No. Draft work is iterative. Valid references and permissions still matter, while completeness is assessed before review or release.'],['Does this guide replace the handbook?','No. Use the licensed handbook and applicable customer requirements for detailed criteria and numerical tables.']]
 },
 {
  slug:'pfd-pfmea-linking',category:'Guide',title:'Keep the process route and its risk analysis connected.',
  summary:'Follow an operation from the process flow into PFMEA coverage without confusing material routing with the failure chain.',
  sections:[
   {title:'Begin with the real manufacturing route',paragraphs:['Map receiving, handling, processing, inspection, storage, and dispatch activities within the agreed boundary. Include outsourced work and relevant nonconforming routes. Show decision outcomes and rework loops explicitly. The actual process and applicable customer requirements determine the coverage.']},
   {title:'Give each operation a stable identity',paragraphs:['Use an operation identifier that survives a description change. Link analysis to that operation rather than matching a name copied between documents. A single operation can have several functions, failure analyses, and controls. Graphical start markers and connectors do not need invented failure rows.']},
   {title:'Review gaps in context',paragraphs:['A process operation without analysis deserves review. It may be a real coverage gap, or an activity with a documented reason for exclusion. A PFMEA entry pointing to an absent operation is a broken relationship. Resolve the underlying relationship before reporting the documents as aligned.']},
   {title:'Review changes across revisions',paragraphs:['When an operation changes, examine its functions, failure causes, controls, and control-plan links. Preserve the previous approved baseline. A new graph position is a layout change; adding a bypass or rework connection is a process-routing change and deserves engineering review.']},
  ],example:['10 · Receive components','20 · Press bushing','30 · Inspect fit','40 · Pack and dispatch'],sources:[references.flow,references.bosch,references.vda],related:['process-flow-diagram','control-plan-sync','aiag-vda-7-step-fmea']
 },
 {
  slug:'control-plan-sync',category:'Guide',title:'Turn the risk analysis into an actionable control plan.',
  summary:'Keep the operation, characteristic, requirement, and control linked while retaining the instructions needed at the point of manufacture.',
  sections:[
   {title:'Start from the operation and characteristic',paragraphs:['Identify the manufacturing operation and the characteristic to be controlled. Preserve the requirement and units. A control plan makes the selected controls usable in production; it is not simply a second copy of the PFMEA form.']},
   {title:'Separate prevention from detection',paragraphs:['A prevention control acts on the cause or its occurrence. A detection control identifies the cause or failure before the defined escape point. Keep those purposes distinct when describing methods and assessing ratings. One instrument name is not a complete inspection instruction.']},
   {title:'Complete the production instruction',paragraphs:['Specify the measurement or control method, sampling and frequency where applicable, responsibility, and reaction when a requirement is not met. These details depend on the actual process and the organization’s control-plan format.'],points:['Which characteristic and specification apply?','How, where, and how often is it checked?','What action contains the issue and restores control?']},
   {title:'Synchronize shared fields with review',paragraphs:['Linked fields reduce repeated transcription. Review changes against the correct document and revision, especially when both documents have been edited. Do not overwrite an approved baseline to make a current draft appear synchronized. Engineering ownership and conflict resolution remain necessary.']},
  ],example:['Operation','Characteristic','Control method','Reaction and owner'],sources:[references.bosch],related:['control-plan','pfd-pfmea-linking','control-plan-enterprise-sync']
 },
 {
  slug:'21-cfr-part-11-fmea',category:'Guide',title:'Electronic records need a defined control strategy.',
  summary:'Understand the boundary between useful revision features and demonstrating that a regulated electronic-record system meets its applicable requirements.',
  sections:[
   {title:'Determine applicability first',paragraphs:['21 CFR Part 11 addresses electronic records and electronic signatures within its scope. It does not make every FMEA a regulated record. Identify the underlying record requirements, intended use, and applicable regulatory context before deciding which controls and validation evidence are necessary.']},
   {title:'Define responsibilities around the record',paragraphs:['Document who can create, revise, review, approve, and retrieve a record. Establish appropriate training and procedures. Access control, traceability, and revision protection support a controlled process; their presence alone does not establish regulatory compliance.']},
   {title:'Assess the complete system',paragraphs:['Review validation, record retention and retrieval, audit-trail behavior, signature meaning and association, identity management, and operating procedures as applicable. Evaluate actual deployed behavior rather than assuming that an interface label or a signature image meets a requirement.']},
   {title:'Use product features as supporting controls',paragraphs:['FMEApex provides document workflows for engineering review, revision status, and traceability. Organizations must assess the configuration, procedures, deployment, and evidence for their intended use. Request a technical review when evaluating regulated workflows. No certification or blanket compliance guarantee is implied.']},
  ],sources:[references.part11],related:['21-cfr-part-11','aiag-vda-7-step-fmea','control-plan-sync']
 },
 {
  slug:'automotive-iatf-16949',category:'Industry',title:'Follow automotive risk from design intent to the production control.',
  summary:'Keep product characteristics, manufacturing operations, failure analysis, and control planning in context across an automotive program.',
  sections:[
   {title:'Carry the requirement into the process',paragraphs:['A product characteristic such as an assembly fit needs an identified manufacturing operation and a usable requirement. Design analysis provides context; process analysis examines how production can fail to achieve the intended result. Do not assume that copying a design failure into a process row completes that analysis.']},
   {title:'Build the actual routing',paragraphs:['Include receiving, handling, manufacturing, verification, and delivery within scope. Consider rework, nonconforming material, and externally performed processes. Customer requirements may add specific coverage and formatting expectations; record them against the program.']},
   {title:'Connect the cause to the production response',paragraphs:['For an illustrative press-fit operation, a fixture condition could contribute to an incorrect fit. Describe how prevention acts on the cause, how detection checks the result, and what the operator does when the requirement is missed. Determine ratings only after evaluating the actual controls and rating criteria.']},
  ],example:['Specified bushing fit','Press-fit operation','Fixture and fit checks','Contain and investigate'],sources:[references.bosch,references.vda],related:['pfd-pfmea-linking','control-plan-sync','action-priority']
 },
 {
  slug:'aerospace-as9100',category:'Industry',title:'Make aerospace process decisions traceable to their engineering context.',
  summary:'Organize manufacturing risk, verification, and revision evidence without treating one template as the complete aerospace quality system.',
  sections:[
   {title:'Define the product and process boundary',paragraphs:['Document the part, revision, interfaces, and manufacturing activities under analysis. Confirm contractual and customer-specific requirements. The required analysis and records depend on the program and its approved procedures.']},
   {title:'Explain special-process and verification interfaces',paragraphs:['Where a process is outsourced or its result cannot be fully verified later, make that interface visible in the route and the analysis. Identify the requirement, process controls, verification evidence, and responsibility rather than leaving a supplier step disconnected.']},
   {title:'Review change impact',paragraphs:['A tooling, supplier, parameter, or verification change can affect several linked records. Use revision context to examine the operation, associated risk, and control instructions together. FMEApex supports organizing those relationships; it does not replace qualification or customer approval.']},
  ],example:['Part requirement','Controlled operation','Verification evidence','Reviewed revision'],sources:[references.iaqg],related:['control-plan-sync','pfd-pfmea-linking','aiag-vda-7-step-fmea']
 },
 {
  slug:'medical-iso-13485',category:'Industry',title:'Keep medical-device manufacturing analysis connected to the requirement.',
  summary:'Follow process functions, failures, controls, and change evidence while keeping FMEA within the wider device risk-management process.',
  sections:[
   {title:'Keep process FMEA in its proper scope',paragraphs:['A manufacturing FMEA examines ways a process may fail. It is one analysis technique and does not replace the complete device risk-management process. Product safety, intended use, foreseeable misuse, and the applicable quality-system requirements need their own assessed scope.']},
   {title:'Trace a requirement into production',paragraphs:['For an illustrative seal operation, identify the relevant requirement, process parameters, verification method, and response to a failed check. Explain how a process failure relates to downstream consequences without assigning generic numerical ratings.']},
   {title:'Evaluate electronic records separately',paragraphs:['Define review, retention, change control, and evidence requirements for the intended use. If electronic-record or signature requirements apply, assess the deployed system and supporting procedures. A revision history is useful evidence, but not a compliance certificate.']},
  ],example:['Seal requirement','Sealing operation','Process and seal checks','Review evidence'],sources:[references.isoMedical,references.part11],related:['21-cfr-part-11-fmea','control-plan-sync','control-plan']
 },
 {
  slug:'semiconductor-jedec',category:'Industry',title:'Connect semiconductor process conditions to failure mechanisms and controls.',
  summary:'Organize operation-level risk and verification across manufacturing stages without losing the process context behind each characteristic.',
  sections:[
   {title:'Choose a meaningful analysis boundary',paragraphs:['Define the product family, manufacturing stage, equipment boundary, and interfaces. A wafer process, assembly process, and final test flow have different functions and potential failures. Record applicable customer and qualification requirements rather than applying a generic industry badge.']},
   {title:'Make process variation explainable',paragraphs:['Separate material inputs, equipment conditions, process parameters, and environmental influences. Describe how each relevant variation can contribute to a failure mechanism. Keep variation notes separate from physical material-flow connections.']},
   {title:'Connect monitoring with a reaction',paragraphs:['Link a controlled parameter or characteristic to its monitoring method and the response to an out-of-limit condition. Preserve units, limits, and responsibility. FMEApex organizes analysis and control-plan relationships; it does not claim to replace a fab’s process-control or manufacturing-execution systems.']},
  ],example:['Process requirement','Manufacturing stage','Parameter monitoring','Hold and investigate'],sources:[references.jedec],related:['pfd-pfmea-linking','control-plan-sync','process-flow-diagram']
 },
 {
  slug:'excel-fmea',category:'Comparison',title:'From individual spreadsheet rows to connected engineering records.',
  summary:'Understand when a familiar workbook is sufficient and when explicit relationships, shared controls, and revision context become valuable.',
  sections:[
   {title:'Start with what your team already understands',paragraphs:['Spreadsheets are familiar, flexible, and useful for exchanging tabular records. Existing workbooks often contain valuable engineering knowledge. The migration task is to preserve that knowledge while identifying the relationships that were previously maintained through naming conventions and manual copying.']},
   {title:'Compare workflows, not just columns',paragraphs:['A connected workspace records the operation behind a PFMEA entry and the control-plan link behind a control. A spreadsheet can represent these relationships too, but the team must define and maintain the conventions or supporting automation. Review how your current process handles simultaneous edits, revision baselines, missing links, and approved changes.']},
   {title:'Migrate a representative project first',paragraphs:['Review source headers, merged cells, operation identifiers, units, and repeated values before import. Reconcile row counts and relationships after import. Keep the original approved workbook as the source baseline until the imported analysis is reviewed. No automatic zero-loss guarantee is appropriate for arbitrary workbook formats.']},
  ],comparison:[['Primary unit','Workbook, sheet, and cell','Structured engineering record'],['Relationships','Team-defined references or automation','Explicit linked operations and controls'],['Flexibility','Open-ended formulas and layouts','Purpose-built analysis workflows'],['Adoption','Familiar spreadsheet skills','Training and reviewed migration']],sources:[],related:['pfd-pfmea-linking','control-plan-sync','aiag-vda-7-step-fmea']
 },
 {
  slug:'iq-rm',category:'Comparison',title:'Evaluate an FMEA workflow against the way your team works.',
  summary:'Use a practical assessment framework when considering FMEApex alongside APIS IQ software. Verify edition-specific capabilities directly with each supplier.',
  sections:[
   {title:'Begin with a representative engineering task',paragraphs:['APIS publishes IQ software for FMEA and related analysis. Product editions, options, and deployment arrangements matter. Run the same real task in each candidate: build structure, connect functions and failures, evaluate controls, revise the analysis, and communicate results. Do not infer that a capability is absent because it is not shown in a short comparison.']},
   {title:'Test relationships and change handling',paragraphs:['Check how the selected product represents your analysis hierarchy and process flow. Change an operation or control and review the resulting impact. Evaluate review roles, revision behavior, imports, exports, and your customer’s required formats using the actual edition and configuration.']},
   {title:'Confirm the operational fit',paragraphs:['Ask each supplier about licensing, support, hosting, security, training, and migration for your intended deployment. FMEApex offers an accessible trial project to inspect its current workflow. Commercial and deployment requirements need a direct quote and technical review; no competitor price or feature-absence claim is made here.']},
  ],comparison:[['Analysis model','Test in the proposed IQ edition','Inspect structure and linked workflows in trial'],['Document exchange','Verify required formats with APIS','Validate representative imports and exports'],['Deployment and support','Confirm the offered configuration','Discuss your requirements with FMEApex'],['Commercial terms','Request a current supplier quote','Request a FMEApex quote']],sources:[references.apis],related:['excel-fmea','aiag-vda-7-step-fmea','control-plan-sync']
 },
 {
  slug:'action-priority',category:'Glossary',title:'Action Priority',summary:'A category derived from severity, occurrence, and detection ratings to support prioritizing risk-reduction action in the applicable FMEA method.',
  sections:[
   {title:'What it tells the team',paragraphs:['Action Priority provides a way to discuss where prevention or detection action deserves attention. Record the rating criteria and the engineering basis behind the inputs. A category alone does not describe the failure or establish that a risk is acceptable.']},
   {title:'Use it with a complete failure chain',paragraphs:['Start with the function, failure mode, effects, causes, and current controls. Use integer S/O/D ratings from the applicable profile. In FMEApex, the category is calculated rather than manually typed. Numerical conformity to a handbook must be verified against that handbook’s exact table.']},
   {title:'Reassess after evidence',paragraphs:['Assign the action, owner, and intended result. Review effectiveness before revising ratings. Completing an action does not automatically justify lower values, especially severity.']},
  ],sources:[references.vda],related:['aiag-vda-7-step-fmea','control-plan','ai-fmea-7-step-deep-dive']
 },
 {
  slug:'process-flow-diagram',category:'Glossary',title:'Process flow diagram',summary:'A visual representation of the activities, connections, and decisions through which a process is performed.',
  sections:[
   {title:'Show how the process actually moves',paragraphs:['A manufacturing process flow communicates the route through operations and relevant inspection, handling, and storage activities. Branches and rework routes should be explicit. Use a stated notation and a legend so readers do not have to guess what a symbol means.']},
   {title:'Keep two structures distinct',paragraphs:['The process flow describes routing. A PFMEA structure tree organizes the process item, steps, and work elements for analysis. They share operation identity but are not interchangeable diagrams. Equipment and variation notes should not be drawn as material streams unless they really represent inputs.']},
   {title:'A practical example',paragraphs:['Receiving → assembly → inspection → dispatch is a simplified route. A real diagram may branch after inspection into accepted material, hold, or a reviewed rework route. A drawing made only from table order must be reviewed before it is treated as the verified route.']},
  ],example:['Receive','Assemble','Inspect','Dispatch'],sources:[references.flow,references.vda],related:['pfd-pfmea-linking','control-plan','pfd-pfmea-orphan-detection']
 },
 {
  slug:'control-plan',category:'Glossary',title:'Control plan',summary:'A production-facing record of what is controlled, how it is controlled, and what happens when the requirement is not met.',
  sections:[
   {title:'Make the control usable',paragraphs:['Identify the operation, characteristic, specification, control method, frequency or sampling where relevant, responsibility, and reaction. The required fields and format depend on the applicable customer and organizational requirements.']},
   {title:'Preserve its connection to the analysis',paragraphs:['The PFMEA explains failure relationships and evaluates controls. The control plan communicates how selected controls are applied in production. Keeping operation and characteristic references aligned helps the team review changes together without treating the documents as identical forms.']},
   {title:'Write a reaction, not a vague instruction',paragraphs:['“Check the part” does not explain what is measured or what to do after a failed result. Define the actual response, containment boundary, escalation, and responsibility appropriate to the process.']},
  ],sources:[references.bosch],related:['control-plan-sync','pfd-pfmea-linking','control-plan-enterprise-sync']
 },
 {
  slug:'21-cfr-part-11',category:'Glossary',title:'21 CFR Part 11',summary:'United States FDA regulations addressing electronic records and electronic signatures within their defined scope.',
  sections:[
   {title:'Start with applicability',paragraphs:['Determine whether the records and signatures are subject to Part 11 and the underlying applicable record requirements. The title of a software feature does not decide applicability.']},
   {title:'Evaluate controls and evidence',paragraphs:['Assess the electronic system, its intended use, configuration, validation, access, audit trails, record retention, signatures, and operating procedures as applicable. A product can support some controls without independently making the complete system compliant.']},
  ],sources:[references.part11],related:['21-cfr-part-11-fmea','medical-iso-13485','aiag-vda-7-step-fmea']
 },
 {
  slug:'ai-fmea-7-step-deep-dive',category:'Journal',title:'Where AI belongs in a seven-step FMEA workflow.',summary:'Useful suggestions start with engineering context and finish with a human decision. They should never become unreviewed changes to a live analysis.',
  sections:[
   {title:'Give a suggestion a defined question',paragraphs:['A broad request to “generate the FMEA” hides the analysis boundary and assumptions. Start with a selected element, its function, operating conditions, and a requirement. Ask for candidate failure causes or missing questions at that level. A response is a proposal to investigate, not evidence that the described process or control exists.']},
   {title:'Keep calculation separate from generation',paragraphs:['The team must establish the failure chain, actual controls, and rating basis. Numerical ratings and AP should follow the configured criteria and calculator. A language model’s plausible explanation is not a substitute for a verified lookup table or process evidence.']},
   {title:'Review the proposal where it will be used',paragraphs:['An engineer should be able to inspect the suggestion, understand its scope, and accept, modify, or reject it. Record the resulting engineering decision in the analysis. Keep preview examples and proposed suggestions separate from approved records.']},
   {title:'Close the learning loop carefully',paragraphs:['Reusable knowledge is most valuable when its context and verification are visible. A standard work-element package can remind the next team what to examine, but its controls and ratings still need review for the new application. Document results and unresolved assumptions rather than treating generated text as a completed study.']},
  ],sources:[references.vda],related:['aiag-vda-7-step-fmea','action-priority','pfd-pfmea-orphan-detection']
 },
 {
  slug:'pfd-pfmea-orphan-detection',category:'Journal',title:'A missing link is a question worth asking.',summary:'Coverage checks are useful when they distinguish broken references, unanalysed operations, and justified exclusions.',
  sections:[
   {title:'Two different gaps need different responses',paragraphs:['A process operation with no PFMEA analysis may indicate missing coverage. A PFMEA record linked to an operation that no longer exists is a broken reference. The first requires a scope and risk review; the second also needs relationship repair. A generic warning count hides this distinction.']},
   {title:'Do not analyze graphical decoration',paragraphs:['A start marker, page connector, or layout bend is not automatically a manufacturing operation. Requiring failure rows for those objects makes coverage look complete while adding no engineering insight. Identify node purpose explicitly and document why a real activity is excluded if appropriate.']},
   {title:'Review the branches',paragraphs:['A straight sequence may miss what happens after an inspection failure, an outsourced operation, or a rework loop. Check these routes against how material is actually handled. Table order alone cannot prove that a diagram captures the real process.']},
   {title:'Use stable references through change',paragraphs:['Names can change and operations can move. Link records using stable identifiers and verify relationships when cloning revisions or importing data. Review the operation’s associated functions, failure causes, and controls before reporting the gap as resolved.']},
  ],sources:[references.flow,references.bosch],related:['pfd-pfmea-linking','process-flow-diagram','control-plan-sync']
 },
 {
  slug:'control-plan-enterprise-sync',category:'Journal',title:'A changed control should have an understandable path.',summary:'A useful synchronization workflow explains what changed, which records share the field, and which revision the decision belongs to.',
  sections:[
   {title:'Agree which information is shared',paragraphs:['Operation identity, characteristic, requirement, and control descriptions can appear in several documents. Define which fields are linked and which are specific to a production instruction. A reaction plan or sampling instruction must not disappear because a source form uses fewer columns.']},
   {title:'Follow one real change',paragraphs:['Suppose a team revises an inspection method after reviewing a failure cause. Check the PFMEA control and its control-plan entry together. Verify that the actual method, requirement, and revision context remain aligned. Record the change and review whether the rating basis is affected; do not assume that a new description means improved detection.']},
   {title:'Expose conflicts instead of hiding them',paragraphs:['If two people edit linked records, silent overwriting can remove a valid decision. Make the conflict visible and let an authorized person resolve it. Preserve the approved baseline while the new draft is being reviewed.']},
   {title:'Verify the instruction at the point of use',paragraphs:['A synchronized record still needs a usable control instruction. Confirm the method, equipment, frequency, owner, and reaction with the people performing the operation. The final check is whether the controlled process and its records agree.']},
  ],sources:[references.bosch],related:['control-plan-sync','control-plan','pfd-pfmea-linking']
 },
];
export function resourcePath(resource: Pick<PublicResource, 'slug' | 'category'>) {
 const prefix = {Guide:'learn',Industry:'fmea',Comparison:'vs',Glossary:'glossary',Journal:'blog'}[resource.category];
 return `/${prefix}/${resource.slug}`;
}
export function findResource(category: ResourceCategory, slug?: string) { return resources.find(item => item.category === category && item.slug === slug); }
export const sectionId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
