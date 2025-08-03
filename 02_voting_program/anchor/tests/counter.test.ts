import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Voting } from 'anchor/target/types/voting'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'

import IDL from '../target/idl/voting.json'
const votingAddress = new PublicKey('FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS')

describe('voting', () => {
  let context
  let provider
  let votingProgram

  beforeAll(async () => {
    context = await startAnchor('', [{ name: 'voting', programId: votingAddress }], [])
    provider = new BankrunProvider(context)

    votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        'what is your favourite programming language?',
        new anchor.BN(0), // poll start time 
        new anchor.BN(1935776000), // poll end time 
      )
      .rpc()

    const [pollAccount] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )
    const poll = await votingProgram.account.poll.fetch(pollAccount)

    console.log(poll)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual('what is your favourite programming language?')
    expect(poll.pollStart.toNumber()).toBeLessThanOrEqual(poll.pollEnd.toNumber())
  })

  it('initialize candidate', async () => {
    await votingProgram.methods.initializeCandidate('Rust', new anchor.BN(1)).rpc()
    await votingProgram.methods.initializeCandidate('JS', new anchor.BN(1)).rpc()
    
    const [rustAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Rust')],
      votingAddress,
    )
    const rustCandidate = await votingProgram.account.candidate.fetch(rustAddress)
    console.log('Rust candidate:', rustCandidate)

    const [jsAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('JS')],
      votingAddress,
    )
    const jsCandidate = await votingProgram.account.candidate.fetch(jsAddress)
    console.log('JS candidate:', jsCandidate)

    // Verify initial vote counts
    expect(rustCandidate.candidateVotes.toNumber()).toEqual(0)
    expect(jsCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  it('vote', async () => {
    // Cast votes for Rust
    await votingProgram.methods
      .vote(new anchor.BN(1), 'Rust')
      .rpc()

    await votingProgram.methods
      .vote(new anchor.BN(1), 'Rust')
      .rpc()

    // Cast vote for JS
    await votingProgram.methods
      .vote(new anchor.BN(1), 'JS')
      .rpc()

    // Check vote counts
    const [rustAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Rust')],
      votingAddress,
    )
    const rustCandidate = await votingProgram.account.candidate.fetch(rustAddress)

    const [jsAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('JS')],
      votingAddress,
    )
    const jsCandidate = await votingProgram.account.candidate.fetch(jsAddress)

    console.log('Final vote counts:')
    console.log('Rust votes:', rustCandidate.candidateVotes.toNumber())
    console.log('JS votes:', jsCandidate.candidateVotes.toNumber())

    // Verify vote counts
    expect(rustCandidate.candidateVotes.toNumber()).toEqual(2)
    expect(jsCandidate.candidateVotes.toNumber()).toEqual(1)
  })
})