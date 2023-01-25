/// <reference types="Cypress" />

describe('teste da API https://serverest.dev/ - Carrinhos', () => {
    let carrinhos
    
    before(() => {
        cy.fixture('carrinhos').then(file => {
            carrinhos = file
        })
    });

    it('listar carrinhos', () => {
        cy.listarCarrinhos().then(response => {
            expect(response.body.carrinhos).to.have.lengthOf(response.body.quantidade)
            carrinhos = response.body.carrinhos
            cy.writeFile('./cypress/fixtures/carrinhos.json', carrinhos)
        })
    });

    it('Cadastrar carrinho', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos
            const max = Math.floor(Math.random() * (produtos.length - 1) + 1)
            for (let i = 0; i < max; i++) {
                let prodComp = {};
                prodComp.idProduto = produtos[i]._id;
                prodComp.quantidade = Math.floor(Math.random() * (produtos[i].quantidade - 1) + 1);
                novoCar.produtos[i] = prodComp;
            }

            cy.usersSemCarrinho().then(usersSemCarrinho => {
                cy.login(usersSemCarrinho).then(responseToken => {
                        cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                            expect(response.body._id).to.exist
                            novoCar._id = response.body._id
                            carrinhos.push(novoCar)
                            cy.writeFile('./cypress/fixtures/carrinhos.json', carrinhos)
                        })
                })
            })
        })
    });

    it('Buscar carrinho por ID', () => {
        cy.listarCarrinhos(carrinhos.filter((carrinhos) => carrinhos._id != undefined)[0]).then(response => {
            expect(response.body.message).to.not.exist
        })
    });

    it('Ao concluir uma compra o carrinho é excluído.', () => {
        cy.usersComCarrinho().then(idUser => {
            let user = {}
            user._id = idUser[0]

            cy.listarUsuarios(user).then(user => {
                cy.login(user.body).then(responseToken => {
                    expect(responseToken.body.authorization).to.exist
                    cy.concluirCompra(responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.have.contain('Registro excluído com sucesso')
                    })
                })
            })
        })
    });

    it('Ao cancelar uma compra o carrinho é excluído e o estoque dos produtos desse carrinho é reabastecido.', () => {
        cy.usersComCarrinho().then(idUser => {
            let user = {}
            user._id = idUser[0]

            cy.listarUsuarios(user).then(user => {
                cy.login(user.body).then(responseToken => {
                    expect(responseToken.body.authorization).to.exist
                    cy.cancelarCompra(responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.have.contain('Registro excluído com sucesso')
                    })
                })
            })
        })
    });
});