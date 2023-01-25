/// <reference types="Cypress" />

describe('teste da API https://serverest.dev/ - Produtos', () => {
    let produtos
    
    before(() => {
        cy.fixture('produtos').then(file => {
            produtos = file
        })
    });

    it('listar produtos cadastrados', () => {
        cy.listarProdutos().then(response => {
            expect(response.body.produtos).to.have.lengthOf(response.body.quantidade)
            produtos = response.body.produtos
            cy.writeFile('./cypress/fixtures/produtos.json', produtos)
        })
    });

    it('cadastrar produto', () => {
        let novoProd = {}
        cy.geraStringAleatoria(5).then(retorno => {novoProd.nome = retorno; novoProd.preco = 255})
        cy.geraStringAleatoria(10).then(retorno => {novoProd.descricao = retorno; novoProd.quantidade = 5})
        
        cy.listarUsuarios().then(listaDeUsuarios => {
            cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                cy.cadastrarProdutos(novoProd, responseToken.body.authorization).then(response => {
                    expect(response.body._id).to.exist
                    novoProd._id = response.body._id
                    produtos.push(novoProd)
                    cy.writeFile('./cypress/fixtures/produtos.json', produtos)
                })
            })
        })
    });

    it('buscar produto pelo id', () => {
        cy.listarProdutos(produtos.filter((produtos) => produtos._id != undefined)[0]).then(response => {
            expect(response.body.message).to.not.exist
        })
    });

    it('atualizar um produto cadastrado', () => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                cy.updateProduto(produtos.filter((prod) => prod._id != undefined)[0], responseToken.body.authorization).then( response => {
                    expect(response.body.message).to.have.contain("Registro alterado com sucesso")
                })
            })
        })
    });

    it('excluir um item da lista produtos.json', () => {
        let sair = false
        let iExcluir = []
        let excluir = produtos.filter((prod, indice) => {
            if (prod._id != undefined) {
                iExcluir.push(indice)
                return true
            }
        })

        cy.listarUsuarios().then(listaDeUsuarios => {
            cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                for (let i = 0; i < excluir.length; i++) {
                    if (sair == true) break
                    cy.excluirProduto(excluir[i], responseToken.body.authorization).then(response => {
                        if(response.body.message == 'Registro excluído com sucesso') {
                            sair = true
                            produtos.splice(iExcluir[i], 1)
                            cy.writeFile('./cypress/fixtures/produtos2.json', produtos)
                        } 
                    }) 
                }
            })
        })
    });
});