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
        cy.geraProd().then(novoProd => {
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
        })
    });

    it('ao tentar cadastrar um produto com mesmo nome recebemos a mensagem "Já existe produto com esse nome"', () => {
        cy.listarProdutos().then(response => {
            let novoProd = response.body.produtos[0]
            delete novoProd._id
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.cadastrarProdutos(novoProd, responseToken.body.authorization).then(response => {
                        expect(response.status).to.equal(400)
                    })
                })
            })
        })
    });

    it('ao tentar cadastrar um produto sem um token válido retornará status 401', () => {
        cy.geraProd().then(novoProd => {
            cy.cadastrarProdutos(novoProd, "semToken").then(response => {
                expect(response.status).to.equal(401)
                expect(response.body.message).to.contain("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
            })
        })
    });

    it('ao tentar cadastrar um produto com o token de um usuário não administrador retornará status 403', () => {
        cy.geraProd().then(novoProd => {
            cy.cadastraUsuario(undefined,"false").then(() => {
                cy.listarUsuarios().then(listaDeUsuarios => {
                    cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'false')[0]).then(responseToken => {
                        cy.cadastrarProdutos(novoProd, responseToken.body.authorization).then(response => {
                            expect(response.status).to.equal(403)
                            expect(response.body.message).to.contain("Rota exclusiva para administradores")
                        })
                    })
                })
            })
        })
    });

    it('buscar produto pelo id', () => {
        cy.listarProdutos(produtos.filter((produtos) => produtos._id != undefined)[0]).then(response => {
            expect(response.body.message).to.not.exist
        })
    });

    it('ao buscar um produto inexistente pelo id deve retornar status 400', () => {
        let prodFake = {}
        prodFake._id = 'idFake'
        cy.listarProdutos(prodFake).then(response => {
            expect(response.status).to.equal(400)
            expect(response.body.message).to.contain("Produto não encontrado")
        })
    });

    it('atualizar um produto cadastrado', () => {
        cy.listarProdutos(listaProdutos => {
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.updateProduto(listaProdutos.body.produtos[0], responseToken.body.authorization).then( response => {
                        expect(response.body.message).to.have.contain("Registro alterado com sucesso")
                    })
                })
            })
        })
    });

    it('ao tentar atualizar um produto inexistente o sistema irá cadastrá-lo', () => {
        cy.geraProd().then(novoProd => {
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.updateProduto(novoProd, responseToken.body.authorization).then( response => {
                        expect(response.status).to.equal(201)
                        expect(response.body.message).to.equal("Cadastro realizado com sucesso")
                    })
                })
            })
        }) 
    });

    it('ao tentar atualizar um produto com o nome de outro já existente retorna status 400', () => {
        cy.listarProdutos().then(listaProds => {
            let atualizaProd = listaProds.body.produtos[0]
            atualizaProd.nome = listaProds.body.produtos[1].nome
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.updateProduto(atualizaProd, responseToken.body.authorization).then( response => {
                        expect(response.status).to.equal(400)
                        expect(response.body.message).to.equal("Já existe produto com esse nome")
                    })
                })
            })
        })
    });

    it('ao tentar atualizar um produto com um token ausente, inválido ou expirado deve retornar status 401', () => {
        cy.listarProdutos().then(listarProdutos => {
            const prods = listarProdutos.body.produtos
            cy.updateProduto(prods[0], 'tokenInvalido').then( response => {
                expect(response.status).to.equal(401)
                expect(response.body.message).to.equal("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
            })
        })
    });

    it('ao tentar atualizar um produto com um usuário não administrador retorna erro 403', () => {
        cy.cadastraUsuario(undefined, 'false').then(respNovoUser => {
            let novoUser = {}
            novoUser._id = respNovoUser.body._id
            cy.listarProdutos().then(listaProdutos => {
                cy.listarUsuarios(novoUser).then(user => {
                    cy.login(user.body).then(responseToken => {
                        cy.updateProduto(listaProdutos.body.produtos[0], responseToken.body.authorization).then( response => {
                            expect(response.status).to.equal(403)
                            expect(response.body.message).to.equal("Rota exclusiva para administradores")
                        })
                    })
                })
            })
        })
    });

    it('excluir um item que não esta em um carrinho de compras', () => {
        cy.listaProdSemCar().then(listaProdSemCar => {
            let excluir = {}
            excluir._id =  listaProdSemCar[0]
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.excluirProduto(excluir, responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.contain('Registro excluído com sucesso') 
                    }) 
                })
            })
        }) 
    });

    it('ao tentar excluir um item inexistente deve retornar mensagem "Nenhum registro excluído"', () => {
        cy.listaProdSemCar().then(listaProdSemCar => {
            let excluir = {}
            excluir._id =  'idInvalido'
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.excluirProduto(excluir, responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.contain('Nenhum registro excluído') 
                    }) 
                })
            })
        }) 
    });

    it('ao tentar excluir um produto que esta no carrinho deve retornar status 400', () => {
        cy.listaProdComCar().then(listaProdComCar => {
            let excluir = {}
            excluir._id =  listaProdComCar[0]
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')[0]).then(responseToken => {
                    cy.excluirProduto(excluir, responseToken.body.authorization).then(response => {
                        expect(response.status).to.equal(400)
                        expect(response.body.message).to.contain("Não é permitido excluir produto que faz parte de carrinho")
                    }) 
                })
            })
        }) 
    });

    it('ao tentar excluir um produto com token ausente, inválido ou expirado deve retornar status 401', () => {
        cy.listaProdSemCar().then(listaProdSemCar => {
            let excluir = {}
            excluir._id =  listaProdSemCar[0]
            cy.excluirProduto(excluir, 'tokenInvalido').then(response => {
                expect(response.status).to.equal(401)
                expect(response.body.message).to.equal("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
            })
        }) 
    });

    it('ao tentar excluir um produto com um user não administrador deve retornar status 403', () => {
        cy.listaProdSemCar().then(listaProdSemCar => {
            let excluir = {}
            excluir._id =  listaProdSemCar[0]
            cy.listarUsuarios().then(listaDeUsuarios => {
                cy.login(listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'false')[0]).then(responseToken => {
                    cy.excluirProduto(excluir, responseToken.body.authorization).then(response => {
                        expect(response.status).to.equal(403)
                        expect(response.body.message).to.equal("Rota exclusiva para administradores")
                    }) 
                })
            })
        }) 
    });
});