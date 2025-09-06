;; CampaignCore.clar
;; Core crowdfunding DAO campaign logic

(define-constant ERR-CAMPAIGN-NOT-STARTED (err u100))
(define-constant ERR-CAMPAIGN-ENDED (err u101))
(define-constant ERR-CAMPAIGN-CANCELED (err u102))
(define-constant ERR-CAMPAIGN-INVALID (err u103))
(define-constant ERR-NOT-CREATOR (err u104))
(define-constant ERR-NOT-SUPPORTER (err u105))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u106))
(define-constant ERR-VOTE-ALREADY-CAST (err u107))
(define-constant ERR-INVALID-GOAL (err u108))
(define-constant ERR-INVALID-DURATION (err u109))
(define-constant ERR-INVALID-ESCROW (err u110))
(define-constant ERR-INVALID-DIST (err u111))

;; -------------------------
;; Storage
;; -------------------------
(define-data-var creator principal tx-sender)
(define-data-var goal-amount uint u0)
(define-data-var start-time uint u0)
(define-data-var duration-fundraise uint u0)
(define-data-var duration-vote uint u0)
(define-data-var theme (string-utf8 100) "")
(define-data-var is-canceled bool false)

;; Escrow and distributor contracts (by creator)
(define-map escrow-contract principal principal)
(define-map distributor-contract principal principal)

;; Contributions
(define-map contributions principal uint)

;; Proposal structure
(define-map proposals uint
  { hash: (buff 32),
    revealed: bool,
    description: (optional (string-utf8 280)),
    budget: uint,
    submitter: principal })

(define-data-var next-id uint u0)

;; Votes: map proposal-id -> total weight
(define-map proposal-votes uint uint)

;; -------------------------
;; Traits
;; -------------------------
(use-trait ft-trait .sip-010-trait.sip-010-trait)

;; -------------------------
;; Helpers
;; -------------------------
(define-private (validate-duration (d uint))
  (if (> d u0)
      (ok true)
      ERR-INVALID-DURATION))

(define-private (only-creator)
  (asserts! (is-eq tx-sender (var-get creator)) ERR-NOT-CREATOR))

(define-private (campaign-active)
  (let ((st (var-get start-time)))
    (if (or (var-get is-canceled) (is-eq st u0))
        ERR-CAMPAIGN-INVALID
        (ok true))))

;; -------------------------
;; Campaign Setup
;; -------------------------
(define-public (init-campaign (new-goal uint) (fundraise-dur uint) (vote-dur uint) (new-theme (string-utf8 100)) (escrow-pr principal) (dist-pr principal))
  (begin
    (only-creator)
    (asserts! (is-eq (var-get start-time) u0) ERR-CAMPAIGN-INVALID)
    (asserts! (> new-goal u0) ERR-INVALID-GOAL)
    (try! (validate-duration fundraise-dur))
    (try! (validate-duration vote-dur))
    (asserts! (is-principal? escrow-pr) ERR-INVALID-ESCROW)
    (asserts! (is-principal? dist-pr) ERR-INVALID-DIST)
    (var-set goal-amount new-goal)
    (var-set duration-fundraise fundraise-dur)
    (var-set duration-vote vote-dur)
    (var-set theme new-theme)
    (map-set escrow-contract (var-get creator) escrow-pr)
    (map-set distributor-contract (var-get creator) dist-pr)
    (var-set start-time block-height)
    (ok true)))

;; -------------------------
;; Contributions
;; -------------------------
(define-public (contribute (amount uint))
  (begin
    (try! (campaign-active))
    (asserts! (> amount u0) (err u200))
    (let ((current (default-to u0 (map-get? contributions tx-sender))))
      (map-set contributions tx-sender (+ current amount)))
    (ok true)))

;; -------------------------
;; Proposals
;; -------------------------
(define-public (submit-proposal-hash (proposal-hash (buff 32)) (budget uint))
  (begin
    (try! (campaign-active))
    (let ((next-id (var-get next-id)))
      (map-set proposals next-id
        { hash: proposal-hash, revealed: false, description: none, budget: budget, submitter: tx-sender })
      (var-set next-id (+ next-id u1))
      (ok next-id))))

(define-public (reveal-proposal (id uint) (desc (string-utf8 280)))
  (let ((prop (map-get? proposals id)))
    (match prop
      proposal
        (begin
          (map-set proposals id { hash: (get hash proposal), revealed: true, description: (some desc), budget: (get budget proposal), submitter: (get submitter proposal) })
          (ok true))
      (err ERR-PROPOSAL-NOT-FOUND))))

;; -------------------------
;; Voting
;; -------------------------
(define-public (cast-vote (proposal-id uint) (vote-weight uint))
  (begin
    (try! (campaign-active))
    (asserts! (> vote-weight u0) (err u201))
    (let ((current (default-to u0 (map-get? proposal-votes proposal-id))))
      (map-set proposal-votes proposal-id (+ current vote-weight)))
    (ok true)))

;; -------------------------
;; Updates
;; -------------------------
(define-public (update-escrow (new-escrow principal))
  (begin
    (only-creator)
    (asserts! (is-principal? new-escrow) ERR-INVALID-ESCROW)
    (try! (map-set escrow-contract (var-get creator) new-escrow))
    (ok true)))

(define-public (update-distributor (new-dist principal))
  (begin
    (only-creator)
    (asserts! (is-principal? new-dist) ERR-INVALID-DIST)
    (try! (map-set distributor-contract (var-get creator) new-dist))
    (ok true)))
