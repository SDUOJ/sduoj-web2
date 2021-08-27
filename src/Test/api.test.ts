import cApi from '../Utils/API/c-api'

test('getCopyright Api',  () => {
    const s1 = cApi.getCopyright()
    const s2 = cApi.getCopyright()

    console.log(s1)
    console.log(s2)

    expect(s1 === s2).toBe(true)
})


